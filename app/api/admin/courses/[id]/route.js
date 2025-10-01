import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Course } from '@/models/Course';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch single course
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
        { success: false, message: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const coursesCollection = db.collection('courses');

    // Fetch course with department details
    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    const courses = await coursesCollection.aggregate(pipeline).toArray();
    const course = courses[0];

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update course
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
        { success: false, message: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      code, 
      description, 
      creditUnits, 
      level, 
      semester, 
      departmentId, 
      prerequisites, 
      isElective, 
      isActive 
    } = body;

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const coursesCollection = db.collection('courses');
    const departmentsCollection = db.collection('departments');

    // Check if course exists
    const existingCourse = await coursesCollection.findOne({ 
      _id: new ObjectId(id) 
    });
    if (!existingCourse) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify department exists if departmentId is being updated
    if (departmentId && departmentId !== existingCourse.departmentId) {
      if (!ObjectId.isValid(departmentId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid department ID' },
          { status: 400 }
        );
      }

      const department = await departmentsCollection.findOne({ 
        _id: new ObjectId(departmentId) 
      });
      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Department not found' },
          { status: 404 }
        );
      }
    }

    // Check if course code is unique (excluding current course)
    if (code && code !== existingCourse.code) {
      const duplicateCourse = await coursesCollection.findOne({
        _id: { $ne: new ObjectId(id) },
        code: { $regex: new RegExp(`^${code}$`, 'i') }
      });

      if (duplicateCourse) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Course with this code already exists' 
          },
          { status: 409 }
        );
      }
    }

    // Validate prerequisites if provided
    if (prerequisites && prerequisites.length > 0) {
      const prerequisiteCourses = await coursesCollection.find({
        code: { $in: prerequisites }
      }).toArray();

      if (prerequisiteCourses.length !== prerequisites.length) {
        const foundCodes = prerequisiteCourses.map(course => course.code);
        const missingCodes = prerequisites.filter(code => !foundCodes.includes(code));
        return NextResponse.json(
          { 
            success: false, 
            message: `Prerequisite courses not found: ${missingCodes.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }

    // Create updated course object
    const updatedCourse = new Course({
      ...existingCourse,
      title: title || existingCourse.title,
      code: code || existingCourse.code,
      description: description !== undefined ? description : existingCourse.description,
      creditUnits: creditUnits !== undefined ? parseInt(creditUnits) : existingCourse.creditUnits,
      level: level !== undefined ? parseInt(level) : existingCourse.level,
      semester: semester !== undefined ? parseInt(semester) : existingCourse.semester,
      departmentId: departmentId || existingCourse.departmentId,
      prerequisites: prerequisites !== undefined ? prerequisites : existingCourse.prerequisites,
      isElective: isElective !== undefined ? isElective : existingCourse.isElective,
      isActive: isActive !== undefined ? isActive : existingCourse.isActive,
      updatedAt: new Date()
    });

    // Validate updated course data
    const validation = updatedCourse.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Update in database
    const result = await coursesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedCourse.toObject() }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse.toObject()
    });

  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete course
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
        { success: false, message: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const coursesCollection = db.collection('courses');
    const courseAssignmentsCollection = db.collection('courseAssignments');

    // Check if course exists
    const course = await coursesCollection.findOne({ 
      _id: new ObjectId(id) 
    });
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course has any assignments
    const assignmentCount = await courseAssignmentsCollection.countDocuments({
      courseId: id
    });

    if (assignmentCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete course. It has associated course assignments.' 
        },
        { status: 409 }
      );
    }

    // Check if course is a prerequisite for other courses
    const dependentCourses = await coursesCollection.find({
      prerequisites: course.code
    }).toArray();

    if (dependentCourses.length > 0) {
      const dependentCourseTitles = dependentCourses.map(c => c.title).join(', ');
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete course. It is a prerequisite for: ${dependentCourseTitles}` 
        },
        { status: 409 }
      );
    }

    // Delete the course
    const result = await coursesCollection.deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}