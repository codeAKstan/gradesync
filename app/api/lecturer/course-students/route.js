export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const semesterId = searchParams.get('semesterId')
    const semesterNameParam = searchParams.get('semester')

    const authResult = await verifyToken(request)
    if (!authResult.success || authResult.type !== 'lecturer' || !authResult.lecturerId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (!courseId || !ObjectId.isValid(courseId)) {
      return NextResponse.json({ success: false, message: 'Invalid or missing courseId' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('gradesynce')

    let semesterFilter = {}
    if (semesterId && ObjectId.isValid(semesterId)) {
      const semesterDoc = await db.collection('semesters').findOne({ _id: new ObjectId(semesterId) })
      if (semesterDoc?.name) {
        semesterFilter = { semester: semesterDoc.name }
      }
    } else if (semesterNameParam) {
      semesterFilter = { semester: semesterNameParam }
    } else {
      const assignment = await db.collection('course_assignments').findOne({
        lecturerId: new ObjectId(authResult.lecturerId),
        courseId: new ObjectId(courseId),
        isActive: true
      })
      if (assignment?.semesterId) {
        const semesterDoc = await db.collection('semesters').findOne({ _id: assignment.semesterId })
        if (semesterDoc?.name) {
          semesterFilter = { semester: semesterDoc.name }
        }
      }
    }

    const pipeline = [
      { $match: { courseId: new ObjectId(courseId), ...semesterFilter } },
      { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'student' } },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          registrationDate: 1,
          status: 1,
          grade: 1,
          gradePoint: 1,
          level: 1,
          semester: '$semester',
          student: {
            _id: '$student._id',
            firstName: '$student.firstName',
            lastName: '$student.lastName',
            matricNumber: '$student.matricNumber',
            email: '$student.email',
            department: '$student.department',
            isActive: '$student.isActive'
          },
          course: {
            _id: '$course._id',
            title: '$course.title',
            code: '$course.code',
            creditUnits: '$course.creditUnits',
            level: '$course.level'
          }
        }
      },
      { $sort: { registrationDate: -1 } }
    ]

    const students = await db.collection('courseregistrations').aggregate(pipeline).toArray()
    return NextResponse.json({ success: true, data: students })
  } catch (error) {
    console.error('Error fetching course students:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}