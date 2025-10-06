import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Course } from '@/models/Course';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch all courses
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
    const departmentId = searchParams.get('departmentId');
    const level = searchParams.get('level');
    const semester = searchParams.get('semester');

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const coursesCollection = db.collection('courses');

    // Build query filter
    const filter = {};
    if (departmentId) {
      if (!ObjectId.isValid(departmentId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid department ID' },
          { status: 400 }
        );
      }
      filter.departmentId = departmentId;
    }
    if (level) {
      filter.level = parseInt(level);
    }
    if (semester) {
      filter.semester = parseInt(semester);
    }

    // Fetch courses with department and semester details
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $lookup: {
          from: 'semesters',
          let: { semesterId: '$semester' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    // Handle string ObjectIds (most common case)
                    {
                      $and: [
                        { $eq: [{ $type: '$$semesterId' }, 'string'] },
                        { $eq: ['$_id', { $toObjectId: '$$semesterId' }] }
                      ]
                    },
                    // Handle ObjectId type
                    {
                      $and: [
                        { $eq: [{ $type: '$$semesterId' }, 'objectId'] },
                        { $eq: ['$_id', '$$semesterId'] }
                      ]
                    },
                    // Handle numeric semester codes (legacy support)
                    {
                      $and: [
                        { $eq: [{ $type: '$$semesterId' }, 'number'] },
                        { $eq: ['$code', '$$semesterId'] }
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'semesterInfo'
        }
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$semesterInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          code: 1,
          description: 1,
          creditUnits: 1,
          level: 1,
          semester: 1,
          semesterName: '$semesterInfo.name',
          departmentId: 1,
          prerequisites: 1,
          isElective: 1,
          department: 1
        }
      },
      { $sort: { level: 1, semester: 1, code: 1 } }
    ];

    const courses = await coursesCollection.aggregate(pipeline).toArray();

    return NextResponse.json({
      success: true,
      data: courses
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new course
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

    // Verify department exists
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

    // Check if course with same code already exists
    const existingCourse = await coursesCollection.findOne({
      code: { $regex: new RegExp(`^${code}$`, 'i') }
    });

    if (existingCourse) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Course with this code already exists' 
        },
        { status: 409 }
      );
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

    // Create new course
    const course = new Course({
      title,
      code,
      description,
      creditUnits: parseInt(creditUnits),
      level: parseInt(level),
      semester: semester,
      departmentId: new ObjectId(departmentId),
      prerequisites: prerequisites || [],
      isElective: isElective || false,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: authResult.adminId
    });

    // Validate course data
    const validation = course.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Save to database
    const result = await coursesCollection.insertOne(course.toObject());

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      data: { id: result.insertedId, ...course.toObject() }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}