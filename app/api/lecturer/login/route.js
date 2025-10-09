import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Lecturer } from '@/models/Lecturer';
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
    const lecturersCollection = db.collection('lecturers');

    // Find lecturer by email (case-insensitive)
    const lecturerData = await lecturersCollection.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    
    if (!lecturerData) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Check if lecturer account is active
    if (!lecturerData.isActive) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Your account has been deactivated. Please contact the administrator.' 
        },
        { status: 401 }
      );
    }

    // Create lecturer instance to use comparePassword method
    const lecturer = new Lecturer(lecturerData);
    
    // Verify password
    const isPasswordValid = await lecturer.comparePassword(password);
    
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
      lecturerId: lecturerData._id.toString(),
      email: lecturerData.email,
      staffId: lecturerData.staffId,
      type: 'lecturer'
    });

    // Update last login time
    await lecturersCollection.updateOne(
      { _id: lecturerData._id },
      { 
        $set: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    // Get department information for response
    const departmentsCollection = db.collection('departments');
    const department = await departmentsCollection.findOne({ 
      _id: lecturerData.departmentId 
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      lecturer: {
        id: lecturerData._id.toString(),
        firstName: lecturerData.firstName,
        lastName: lecturerData.lastName,
        email: lecturerData.email,
        staffId: lecturerData.staffId,
        title: lecturerData.title,
        department: department ? {
          id: department._id.toString(),
          name: department.name,
          code: department.code
        } : null
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Lecturer login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}