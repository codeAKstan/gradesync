import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// GET - Fetch all admins
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
    const adminsCollection = db.collection('admins');

    // Fetch all admins (excluding passwords)
    const admins = await adminsCollection.find(
      {},
      { 
        projection: { 
          password: 0 // Exclude password field
        },
        sort: { createdAt: -1 }
      }
    ).toArray();

    return NextResponse.json({
      success: true,
      data: admins
    });

  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}