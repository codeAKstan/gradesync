import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Admin } from '@/models/Admin';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('gradesynce');
    const adminsCollection = db.collection('admins');

    // Allow multiple admins - removed restriction check

    // Check if admin with this email already exists (additional safety check)
    const existingAdmin = await adminsCollection.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Admin with this email already exists.' 
        },
        { status: 409 }
      );
    }

    // Create new admin instance
    const admin = new Admin({
      email,
      password,
      firstName,
      lastName
    });

    // Validate admin data
    const validation = admin.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    // Hash password
    await admin.hashPassword();

    // Save admin to database
    const result = await adminsCollection.insertOne(admin.toObject());

    if (result.insertedId) {
      // Generate JWT token
      const token = generateToken({
        adminId: result.insertedId.toString(),
        email: admin.email,
        role: 'admin'
      });

      return NextResponse.json({
        success: true,
        message: 'Admin account created successfully',
        token,
        admin: {
          id: result.insertedId.toString(),
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName
        }
      }, { status: 201 });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to create admin account' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Admin signup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}