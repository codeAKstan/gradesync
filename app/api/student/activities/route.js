import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch student activities
export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('gradesynce');
    const activitiesCollection = db.collection('studentactivities');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = parseInt(searchParams.get('skip')) || 0;

    // Fetch activities for the authenticated student
    const activities = await activitiesCollection
      .find({ studentId: new ObjectId(authResult.studentId) })
      .sort({ timestamp: -1 }) // Most recent first
      .limit(limit)
      .skip(skip)
      .toArray();

    // Get total count for pagination
    const totalCount = await activitiesCollection.countDocuments({
      studentId: new ObjectId(authResult.studentId)
    });

    return NextResponse.json({
      success: true,
      data: activities,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + activities.length < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching student activities:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new activity (for internal use)
export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { activityType, title, description, metadata } = body;

    // Validate required fields
    if (!activityType || !title || !description) {
      return NextResponse.json(
        { success: false, message: 'Activity type, title, and description are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('gradesynce');
    const activitiesCollection = db.collection('studentactivities');

    // Create activity object
    const activity = {
      studentId: new ObjectId(authResult.studentId),
      activityType,
      title,
      description,
      metadata: metadata || {},
      timestamp: new Date(),
      isRead: false,
      createdAt: new Date()
    };

    // Insert activity
    const result = await activitiesCollection.insertOne(activity);

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...activity
      }
    });

  } catch (error) {
    console.error('Error creating student activity:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}