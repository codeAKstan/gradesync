import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Student } from '@/models/Student';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, matricNumber, department, password, confirmPassword } = body;

    // Validate that passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Create new student instance
    const student = new Student({
      firstName,
      lastName,
      email: email.toLowerCase(),
      matricNumber: matricNumber.toUpperCase(),
      department,
      password
    });

    // Validate student data
    const validation = student.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const studentsCollection = db.collection('students');

    // Check if student with same email or matric number already exists
    const existingStudent = await studentsCollection.findOne({
      $or: [
        { email: student.email },
        { matricNumber: student.matricNumber }
      ]
    });

    if (existingStudent) {
      const duplicateField = existingStudent.email === student.email ? 'email' : 'matric number';
      return NextResponse.json(
        { success: false, message: `Student with this ${duplicateField} already exists` },
        { status: 409 }
      );
    }

    // Hash password before saving
    await student.hashPassword();

    // Save to database
    const result = await studentsCollection.insertOne(student.toObject());

    if (result.insertedId) {
      // Generate JWT token
      const token = generateToken({
        studentId: result.insertedId.toString(),
        email: student.email,
        type: 'student'
      });

      // Return success response with token and student data (without password)
      return NextResponse.json({
        success: true,
        message: 'Student registered successfully',
        token,
        student: {
          id: result.insertedId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          matricNumber: student.matricNumber,
          department: student.department
        }
      }, { status: 201 });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create student account' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}