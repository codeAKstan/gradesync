import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Department } from '@/models/Department';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch all departments
export async function GET(request) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const authResult = verifyToken(token);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const departmentsCollection = db.collection('departments');

    const departments = await departmentsCollection.find({}).sort({ name: 1 }).toArray();

    return NextResponse.json({
      success: true,
      data: departments
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new department
export async function POST(request) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const authResult = verifyToken(token);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, code, description, hodEmail, hodName, isActive } = body;

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const departmentsCollection = db.collection('departments');

    // Check if department with same name or code already exists
    const existingDepartment = await departmentsCollection.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { code: { $regex: new RegExp(`^${code}$`, 'i') } }
      ]
    });

    if (existingDepartment) {
      const duplicateField = existingDepartment.name.toLowerCase() === name.toLowerCase() ? 'name' : 'code';
      return NextResponse.json(
        { 
          success: false, 
          message: `Department with this ${duplicateField} already exists` 
        },
        { status: 409 }
      );
    }

    // Create new department
    const department = new Department({
      name,
      code,
      description,
      hodEmail,
      hodName,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: authResult.id || authResult.adminId || 'unknown'
    });

    // Validate department data
    const validation = department.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Save to database
    const result = await departmentsCollection.insertOne(department.toObject());

    return NextResponse.json({
      success: true,
      message: 'Department created successfully',
      data: { id: result.insertedId, ...department.toObject() }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}