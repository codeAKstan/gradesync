import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Semester } from '@/models/Semester';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch all semesters
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
    const academicSessionId = searchParams.get('academicSessionId');

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const semestersCollection = db.collection('semesters');

    // Build query filter
    const filter = {};
    if (academicSessionId) {
      filter.academicSessionId = academicSessionId;
    }

    // Fetch semesters with academic session details
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'academic_sessions',
          localField: 'academicSessionId',
          foreignField: '_id',
          as: 'academicSession'
        }
      },
      {
        $unwind: {
          path: '$academicSession',
          preserveNullAndEmptyArrays: true
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    const semesters = await semestersCollection.aggregate(pipeline).toArray();

    return NextResponse.json({
      success: true,
      data: semesters
    });

  } catch (error) {
    console.error('Error fetching semesters:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new semester
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
    const { name, code, academicSessionId, startDate, endDate, isActive, description } = body;

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const semestersCollection = db.collection('semesters');
    const sessionsCollection = db.collection('academic_sessions');

    // Verify academic session exists
    if (!ObjectId.isValid(academicSessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid academic session ID' },
        { status: 400 }
      );
    }

    const academicSession = await sessionsCollection.findOne({ 
      _id: new ObjectId(academicSessionId) 
    });
    if (!academicSession) {
      return NextResponse.json(
        { success: false, message: 'Academic session not found' },
        { status: 404 }
      );
    }

    // Check if semester with same code already exists in the same academic session
    console.log('Checking for existing semester with:', { code, academicSessionId, academicSessionIdType: typeof academicSessionId });
    const existingSemester = await semestersCollection.findOne({ 
      code, 
      academicSessionId: new ObjectId(academicSessionId)
    });
    console.log('Existing semester found:', existingSemester);
    if (existingSemester) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Semester with this code already exists in the selected academic session' 
        },
        { status: 409 }
      );
    }

    // If this semester is being set as active, deactivate all other semesters in the same session
    if (isActive) {
      await semestersCollection.updateMany(
        { academicSessionId: new ObjectId(academicSessionId), isActive: true },
        { $set: { isActive: false, updatedAt: new Date() } }
      );
    }

    // Create new semester
    const semester = new Semester({
      name,
      code,
      academicSessionId: new ObjectId(academicSessionId),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive || false,
      description,
      createdBy: authResult.adminId
    });

    // Validate semester data
    const validation = semester.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Save to database
    const result = await semestersCollection.insertOne(semester.toObject());

    return NextResponse.json({
      success: true,
      message: 'Semester created successfully',
      data: { id: result.insertedId, ...semester.toObject() }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating semester:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}