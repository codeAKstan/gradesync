import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Lecturer } from '@/models/Lecturer';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch all lecturers
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

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const lecturersCollection = db.collection('lecturers');

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

    // Fetch lecturers with department details
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
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          password: 0 // Exclude password from response
        }
      },
      { $sort: { lastName: 1, firstName: 1 } }
    ];

    const lecturers = await lecturersCollection.aggregate(pipeline).toArray();

    return NextResponse.json({
      success: true,
      data: lecturers
    });

  } catch (error) {
    console.error('Error fetching lecturers:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new lecturer
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
      firstName, 
      lastName, 
      email, 
      password, 
      staffId, 
      departmentId, 
      phone, 
      title, 
      qualification, 
      specialization, 
      isActive 
    } = body;

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const lecturersCollection = db.collection('lecturers');
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

    // Check if lecturer with same email or staff ID already exists
    const existingLecturer = await lecturersCollection.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { staffId: { $regex: new RegExp(`^${staffId}$`, 'i') } }
      ]
    });

    if (existingLecturer) {
      const duplicateField = existingLecturer.email.toLowerCase() === email.toLowerCase() ? 'email' : 'staff ID';
      return NextResponse.json(
        { 
          success: false, 
          message: `Lecturer with this ${duplicateField} already exists` 
        },
        { status: 409 }
      );
    }

    // Create new lecturer
    const lecturer = new Lecturer({
      firstName,
      lastName,
      email,
      password,
      staffId,
      departmentId,
      phone,
      title,
      qualification,
      specialization,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: authResult.admin.id
    });

    // Validate lecturer data
    const validation = lecturer.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Hash password before saving
    await lecturer.hashPassword();

    // Save to database
    const result = await lecturersCollection.insertOne(lecturer.toObject());

    // Return lecturer data without password
    const lecturerData = lecturer.getPublicProfile();
    lecturerData.id = result.insertedId;

    return NextResponse.json({
      success: true,
      message: 'Lecturer created successfully',
      data: lecturerData
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating lecturer:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}