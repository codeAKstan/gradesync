import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { AcademicSession } from '@/models/AcademicSession';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch single academic session
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
        { success: false, message: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const sessionsCollection = db.collection('academic_sessions');

    const session = await sessionsCollection.findOne({ _id: new ObjectId(id) });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Academic session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Error fetching academic session:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update academic session
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
    const body = await request.json();
    const { name, startDate, endDate, isActive, description } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const sessionsCollection = db.collection('academic_sessions');

    // Check if session exists
    const existingSession = await sessionsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingSession) {
      return NextResponse.json(
        { success: false, message: 'Academic session not found' },
        { status: 404 }
      );
    }

    // Check if another session with same name exists (excluding current session)
    if (name && name !== existingSession.name) {
      const duplicateSession = await sessionsCollection.findOne({ 
        name, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (duplicateSession) {
        return NextResponse.json(
          { success: false, message: 'Academic session with this name already exists' },
          { status: 409 }
        );
      }
    }

    // If this session is being set as active, deactivate all other sessions
    if (isActive && !existingSession.isActive) {
      await sessionsCollection.updateMany(
        { _id: { $ne: new ObjectId(id) }, isActive: true },
        { $set: { isActive: false, updatedAt: new Date() } }
      );
    }

    // Create updated session object
    const updatedSession = new AcademicSession({
      ...existingSession,
      name: name || existingSession.name,
      startDate: startDate ? new Date(startDate) : existingSession.startDate,
      endDate: endDate ? new Date(endDate) : existingSession.endDate,
      isActive: isActive !== undefined ? isActive : existingSession.isActive,
      description: description !== undefined ? description : existingSession.description,
      updatedAt: new Date()
    });

    // Validate updated session data
    const validation = updatedSession.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Update in database
    const result = await sessionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedSession.toObject() }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Academic session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Academic session updated successfully',
      data: { id, ...updatedSession.toObject() }
    });

  } catch (error) {
    console.error('Error updating academic session:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete academic session
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
        { success: false, message: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const sessionsCollection = db.collection('academic_sessions');
    const semestersCollection = db.collection('semesters');

    // Check if session has associated semesters
    const associatedSemesters = await semestersCollection.countDocuments({ 
      academicSessionId: id 
    });

    if (associatedSemesters > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete academic session with associated semesters. Please delete semesters first.' 
        },
        { status: 409 }
      );
    }

    // Delete the session
    const result = await sessionsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Academic session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Academic session deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting academic session:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}