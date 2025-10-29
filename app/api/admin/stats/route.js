import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// GET - Admin stats (counts of key collections)
export async function GET(request) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');

    const [studentsCount, coursesCount, gradeReportsCount] = await Promise.all([
      db.collection('students').countDocuments({}),
      db.collection('courses').countDocuments({}),
      db.collection('student_results').countDocuments({})
    ]);

    return NextResponse.json({
      success: true,
      data: {
        students: studentsCount,
        courses: coursesCount,
        gradeReports: gradeReportsCount
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}