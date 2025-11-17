import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Semester } from '@/models/Semester';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch single semester
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
        { success: false, message: 'Invalid semester ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const semestersCollection = db.collection('semesters');

    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $addFields: {
          academicSessionIdObj: {
            $convert: {
              input: '$academicSessionId',
              to: 'objectId',
              onError: '$academicSessionId',
              onNull: '$academicSessionId'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'academic_sessions',
          localField: 'academicSessionIdObj',
          foreignField: '_id',
          as: 'academicSession'
        }
      },
      {
        $unwind: {
          path: '$academicSession',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    const result = await semestersCollection.aggregate(pipeline).toArray();
    const semester = result[0];

    if (!semester) {
      return NextResponse.json(
        { success: false, message: 'Semester not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: semester
    });

  } catch (error) {
    console.error('Error fetching semester:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update semester
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
    const { name, code, academicSessionId, startDate, endDate, isActive, description } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid semester ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const semestersCollection = db.collection('semesters');
    const sessionsCollection = db.collection('academic_sessions');

    // Check if semester exists
    const existingSemester = await semestersCollection.findOne({ _id: new ObjectId(id) });
    if (!existingSemester) {
      return NextResponse.json(
        { success: false, message: 'Semester not found' },
        { status: 404 }
      );
    }

    // Normalize IDs for comparison
    const existingSessionIdStr = existingSemester.academicSessionId?.toString();
    const incomingSessionIdStr = academicSessionId ? new ObjectId(academicSessionId).toString() : existingSessionIdStr;

    // Verify academic session exists if being updated and changed
    if (academicSessionId) {
      if (!ObjectId.isValid(academicSessionId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid academic session ID' },
          { status: 400 }
        );
      }

      if (incomingSessionIdStr !== existingSessionIdStr) {
        const academicSession = await sessionsCollection.findOne({ 
          _id: new ObjectId(academicSessionId) 
        });
        if (!academicSession) {
          return NextResponse.json(
            { success: false, message: 'Academic session not found' },
            { status: 404 }
          );
        }
      }
    }

    // Check if another semester with same code exists in the same session (excluding current semester)
    if (code && (code !== existingSemester.code || incomingSessionIdStr !== existingSessionIdStr)) {
      const duplicateSemester = await semestersCollection.findOne({ 
        code, 
        academicSessionId: academicSessionId ? new ObjectId(academicSessionId) : existingSemester.academicSessionId,
        _id: { $ne: new ObjectId(id) } 
      });
      if (duplicateSemester) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Semester with this code already exists in the selected academic session' 
          },
          { status: 409 }
        );
      }
    }

    // If this semester is being set as active, deactivate all other semesters in the same session
    if (isActive && !existingSemester.isActive) {
      await semestersCollection.updateMany(
        { 
          academicSessionId: academicSessionId ? new ObjectId(academicSessionId) : existingSemester.academicSessionId,
          _id: { $ne: new ObjectId(id) },
          isActive: true 
        },
        { $set: { isActive: false, updatedAt: new Date() } }
      );
    }

    // Create updated semester object
    const updatedSemester = new Semester({
      ...existingSemester,
      name: name || existingSemester.name,
      code: code || existingSemester.code,
      academicSessionId: academicSessionId ? new ObjectId(academicSessionId) : existingSemester.academicSessionId,
      startDate: startDate ? new Date(startDate) : existingSemester.startDate,
      endDate: endDate ? new Date(endDate) : existingSemester.endDate,
      isActive: isActive !== undefined ? isActive : existingSemester.isActive,
      description: description !== undefined ? description : existingSemester.description,
      updatedAt: new Date()
    });

    // Validate updated semester data
    const validation = updatedSemester.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Update in database
    const result = await semestersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedSemester.toObject() }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Semester not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Semester updated successfully',
      data: { id, ...updatedSemester.toObject() }
    });

  } catch (error) {
    console.error('Error updating semester:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete semester
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
        { success: false, message: 'Invalid semester ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const semestersCollection = db.collection('semesters');
    const assignmentsCollection = db.collection('course_assignments');

    // Check if semester has associated course assignments
    const associatedAssignments = await assignmentsCollection.countDocuments({ 
      semesterId: id 
    });

    if (associatedAssignments > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete semester with associated course assignments. Please remove assignments first.' 
        },
        { status: 409 }
      );
    }

    // Delete the semester
    const result = await semestersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Semester not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Semester deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting semester:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}