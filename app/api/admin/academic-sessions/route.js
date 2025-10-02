import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { AcademicSession } from '@/models/AcademicSession';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch all academic sessions
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

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const sessionsCollection = db.collection('academic_sessions');

    const sessions = await sessionsCollection.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('Error fetching academic sessions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new academic session
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
    const { name, startDate, endDate, isActive, description } = body;

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const sessionsCollection = db.collection('academic_sessions');

    // Check if session with same name already exists
    const existingSession = await sessionsCollection.findOne({ name });
    if (existingSession) {
      return NextResponse.json(
        { success: false, message: 'Academic session with this name already exists' },
        { status: 409 }
      );
    }

    // If this session is being set as active, deactivate all other sessions
    if (isActive) {
      await sessionsCollection.updateMany(
        { isActive: true },
        { $set: { isActive: false, updatedAt: new Date() } }
      );
    }

    // Create new academic session
    const session = new AcademicSession({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive || false,
      description,
      createdBy: authResult.adminId
    });

    // Validate session data
    const validation = session.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Save to database
    const result = await sessionsCollection.insertOne(session.toObject());

    return NextResponse.json({
      success: true,
      message: 'Academic session created successfully',
      data: { id: result.insertedId, ...session.toObject() }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating academic session:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}