import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Student } from '@/models/Student';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate login credentials
    const validation = Student.validateLoginCredentials(email, password);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const studentsCollection = db.collection('students');

    // Find student by email
    const studentData = await studentsCollection.findOne({ 
      email: email.toLowerCase() 
    });

    if (!studentData) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if student account is active
    if (!studentData.isActive) {
      return NextResponse.json(
        { success: false, message: 'Your account has been deactivated. Please contact administration.' },
        { status: 403 }
      );
    }

    // Create student instance to use comparePassword method
    const student = new Student(studentData);
    student._id = studentData._id;

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, studentData.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      studentId: studentData._id.toString(),
      email: studentData.email,
      type: 'student'
    });

    // Update last login timestamp
    await studentsCollection.updateOne(
      { _id: studentData._id },
      { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
    );

    // Return success response with token and student data (without password)
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      student: {
        id: studentData._id,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email,
        matricNumber: studentData.matricNumber,
        department: studentData.department
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}