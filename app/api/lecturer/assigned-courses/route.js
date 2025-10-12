import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success || authResult.type !== 'lecturer' || !authResult.lecturerId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('gradesynce')
    const assignmentsCollection = db.collection('course_assignments')

    const pipeline = [
      { $match: { lecturerId: new ObjectId(authResult.lecturerId), isActive: true } },
      { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: false } },
      { $lookup: { from: 'academic_sessions', localField: 'academicSessionId', foreignField: '_id', as: 'academicSession' } },
      { $unwind: { path: '$academicSession', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'semesters', localField: 'semesterId', foreignField: '_id', as: 'semester' } },
      { $unwind: { path: '$semester', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          assignmentType: 1,
          isActive: 1,
          assignedAt: 1,
          notes: 1,
          course: { _id: '$course._id', title: '$course.title', code: '$course.code', creditUnits: '$course.creditUnits', level: '$course.level', semester: '$course.semester' },
          academicSession: { _id: '$academicSession._id', startYear: '$academicSession.startYear', endYear: '$academicSession.endYear' },
          semester: { _id: '$semester._id', name: '$semester.name' }
        }
      },
      { $sort: { assignedAt: -1 } }
    ]

    const assignedCourses = await assignmentsCollection.aggregate(pipeline).toArray()
    return NextResponse.json({ success: true, data: assignedCourses })
  } catch (error) {
    console.error('Error fetching lecturer assigned courses:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}