import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { CourseAssignment } from '@/models/CourseAssignment';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch all course assignments
export async function GET(request) {
  try {
    // Verify admin authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lecturerId = searchParams.get('lecturerId');
    const courseId = searchParams.get('courseId');
    const academicSessionId = searchParams.get('academicSessionId');
    const semesterId = searchParams.get('semesterId');
    const isActive = searchParams.get('isActive');

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const courseAssignmentsCollection = db.collection('courseAssignments');

    // Build query filter
    const filter = {};
    if (lecturerId) {
      if (!ObjectId.isValid(lecturerId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid lecturer ID' },
          { status: 400 }
        );
      }
      filter.lecturerId = lecturerId;
    }
    if (courseId) {
      if (!ObjectId.isValid(courseId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid course ID' },
          { status: 400 }
        );
      }
      filter.courseId = courseId;
    }
    if (academicSessionId) {
      if (!ObjectId.isValid(academicSessionId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid academic session ID' },
          { status: 400 }
        );
      }
      filter.academicSessionId = academicSessionId;
    }
    if (semesterId) {
      if (!ObjectId.isValid(semesterId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid semester ID' },
          { status: 400 }
        );
      }
      filter.semesterId = semesterId;
    }
    if (isActive !== null && isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Fetch assignments with related data
    const pipeline = [
      { $match: filter },
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
          from: 'academicSessions',
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
      },
      { $sort: { createdAt: -1 } }
    ];

    const assignments = await courseAssignmentsCollection.aggregate(pipeline).toArray();

    return NextResponse.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching course assignments:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new course assignment
export async function POST(request) {
  try {
    // Verify admin authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
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
    const courseAssignmentsCollection = db.collection('courseAssignments');
    const coursesCollection = db.collection('courses');
    const lecturersCollection = db.collection('lecturers');
    const academicSessionsCollection = db.collection('academic_sessions');
    const semestersCollection = db.collection('semesters');

    // Validate all required IDs
    const requiredIds = [
      { id: courseId, name: 'course' },
      { id: lecturerId, name: 'lecturer' },
      { id: academicSessionId, name: 'academic session' },
      { id: semesterId, name: 'semester' }
    ];

    for (const { id, name } of requiredIds) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, message: `Invalid ${name} ID` },
          { status: 400 }
        );
      }
    }

    // Verify all entities exist
    const [course, lecturer, academicSession, semester] = await Promise.all([
      coursesCollection.findOne({ _id: new ObjectId(courseId) }),
      lecturersCollection.findOne({ _id: new ObjectId(lecturerId) }),
      academicSessionsCollection.findOne({ _id: new ObjectId(academicSessionId) }),
      semestersCollection.findOne({ _id: new ObjectId(semesterId) })
    ]);

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    if (!lecturer) {
      return NextResponse.json(
        { success: false, message: 'Lecturer not found' },
        { status: 404 }
      );
    }

    if (!academicSession) {
      return NextResponse.json(
        { success: false, message: 'Academic session not found' },
        { status: 404 }
      );
    }

    if (!semester) {
      return NextResponse.json(
        { success: false, message: 'Semester not found' },
        { status: 404 }
      );
    }

    // Verify semester belongs to the academic session
    if (semester.academicSessionId !== academicSessionId) {
      return NextResponse.json(
        { success: false, message: 'Semester does not belong to the specified academic session' },
        { status: 400 }
      );
    }

    // Check for existing assignment (same course, lecturer, academic session, semester)
    const existingAssignment = await courseAssignmentsCollection.findOne({
      courseId,
      lecturerId,
      academicSessionId,
      semesterId,
      isActive: true
    });

    if (existingAssignment) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'An active assignment already exists for this course, lecturer, academic session, and semester combination' 
        },
        { status: 409 }
      );
    }

    // Create new course assignment
    const courseAssignment = new CourseAssignment({
      courseId,
      lecturerId,
      academicSessionId,
      semesterId,
      assignmentType: assignmentType || 'primary',
      notes: notes || '',
      isActive: isActive !== undefined ? isActive : true,
      assignedBy: authResult.admin.id,
      assignedAt: new Date()
    });

    // Validate assignment data
    const validation = courseAssignment.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Save to database
    const result = await courseAssignmentsCollection.insertOne(courseAssignment.toObject());

    return NextResponse.json({
      success: true,
      message: 'Course assignment created successfully',
      data: { id: result.insertedId, ...courseAssignment.toObject() }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating course assignment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}