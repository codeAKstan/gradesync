import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Admin } from '@/models/Admin';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('gradesynce');
    const adminsCollection = db.collection('admins');

    // Find admin by email
    const adminData = await adminsCollection.findOne({ email });
    
    if (!adminData) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Create admin instance to use comparePassword method
    const admin = new Admin(adminData);
    
    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      adminId: adminData._id.toString(),
      email: adminData.email,
      role: 'admin'
    });

    // Update last login time
    await adminsCollection.updateOne(
      { _id: adminData._id },
      { 
        $set: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: adminData._id.toString(),
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}