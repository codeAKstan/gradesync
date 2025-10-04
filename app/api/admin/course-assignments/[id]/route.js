import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { CourseAssignment } from '@/models/CourseAssignment';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch single course assignment
export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const courseAssignmentsCollection = db.collection('course_assignments');

    // Fetch assignment with related data
    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $lookup: {
          from: 'lecturers',
          localField: 'lecturerId',
          foreignField: '_id',
          as: 'lecturer'
        }
      },
      {
        $lookup: {
          from: 'academic_sessions',
          localField: 'academicSessionId',
          foreignField: '_id',
          as: 'academicSession'
        }
      },
      {
        $lookup: {
          from: 'semesters',
          localField: 'semesterId',
          foreignField: '_id',
          as: 'semester'
        }
      },
      {
        $unwind: {
          path: '$course',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$lecturer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$academicSession',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$semester',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          'lecturer.password': 0 // Exclude lecturer password
        }
      }
    ];

    const assignments = await courseAssignmentsCollection.aggregate(pipeline).toArray();
    const assignment = assignments[0];

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: 'Course assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assignment
    });

  } catch (error) {
    console.error('Error fetching course assignment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update course assignment
export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      courseId, 
      lecturerId, 
      academicSessionId, 
      semesterId, 
      assignmentType, 
      notes, 
      isActive 
    } = body;

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const courseAssignmentsCollection = db.collection('course_assignments');
    const coursesCollection = db.collection('courses');
    const lecturersCollection = db.collection('lecturers');
    const academicSessionsCollection = db.collection('academic_sessions');
    const semestersCollection = db.collection('semesters');

    // Check if assignment exists
    const existingAssignment = await courseAssignmentsCollection.findOne({ 
      _id: new ObjectId(id) 
    });
    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, message: 'Course assignment not found' },
        { status: 404 }
      );
    }

    // Validate IDs if they are being updated
    const idsToValidate = [];
    if (courseId && courseId !== existingAssignment.courseId) {
      idsToValidate.push({ id: courseId, name: 'course', collection: coursesCollection });
    }
    if (lecturerId && lecturerId !== existingAssignment.lecturerId) {
      idsToValidate.push({ id: lecturerId, name: 'lecturer', collection: lecturersCollection });
    }
    if (academicSessionId && academicSessionId !== existingAssignment.academicSessionId) {
      idsToValidate.push({ id: academicSessionId, name: 'academic session', collection: academicSessionsCollection });
    }
    if (semesterId && semesterId !== existingAssignment.semesterId) {
      idsToValidate.push({ id: semesterId, name: 'semester', collection: semestersCollection });
    }

    // Validate and check existence of updated entities
    for (const { id: entityId, name, collection } of idsToValidate) {
      if (!ObjectId.isValid(entityId)) {
        return NextResponse.json(
          { success: false, message: `Invalid ${name} ID` },
          { status: 400 }
        );
      }

      const entity = await collection.findOne({ _id: new ObjectId(entityId) });
      if (!entity) {
        return NextResponse.json(
          { success: false, message: `${name.charAt(0).toUpperCase() + name.slice(1)} not found` },
          { status: 404 }
        );
      }
    }

    // If semester is being updated, verify it belongs to the academic session
    const finalAcademicSessionId = academicSessionId || existingAssignment.academicSessionId;
    const finalSemesterId = semesterId || existingAssignment.semesterId;

    if (semesterId || academicSessionId) {
      const semester = await semestersCollection.findOne({ _id: new ObjectId(finalSemesterId) });
      if (semester && semester.academicSessionId !== finalAcademicSessionId) {
        return NextResponse.json(
          { success: false, message: 'Semester does not belong to the specified academic session' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate assignment (excluding current one)
    const finalCourseId = courseId || existingAssignment.courseId;
    const finalLecturerId = lecturerId || existingAssignment.lecturerId;

    const duplicateAssignment = await courseAssignmentsCollection.findOne({
      _id: { $ne: new ObjectId(id) },
      courseId: finalCourseId,
      lecturerId: finalLecturerId,
      academicSessionId: finalAcademicSessionId,
      semesterId: finalSemesterId,
      isActive: true
    });

    if (duplicateAssignment) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'An active assignment already exists for this course, lecturer, academic session, and semester combination' 
        },
        { status: 409 }
      );
    }

    // Create updated assignment object
    const updatedAssignment = new CourseAssignment({
      ...existingAssignment,
      courseId: finalCourseId,
      lecturerId: finalLecturerId,
      academicSessionId: finalAcademicSessionId,
      semesterId: finalSemesterId,
      assignmentType: assignmentType || existingAssignment.assignmentType,
      notes: notes !== undefined ? notes : existingAssignment.notes,
      isActive: isActive !== undefined ? isActive : existingAssignment.isActive,
      updatedAt: new Date()
    });

    // Validate updated assignment data
    const validation = updatedAssignment.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Update in database
    const result = await courseAssignmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedAssignment.toObject() }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Course assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course assignment updated successfully',
      data: updatedAssignment.toObject()
    });

  } catch (error) {
    console.error('Error updating course assignment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete course assignment
export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const courseAssignmentsCollection = db.collection('course_assignments');

    // Check if assignment exists
    const assignment = await courseAssignmentsCollection.findOne({ 
      _id: new ObjectId(id) 
    });
    if (!assignment) {
      return NextResponse.json(
        { success: false, message: 'Course assignment not found' },
        { status: 404 }
      );
    }

    // Delete the assignment
    const result = await courseAssignmentsCollection.deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Course assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course assignment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting course assignment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}