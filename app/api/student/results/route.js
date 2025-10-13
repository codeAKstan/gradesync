export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

// GET - Fetch student results grouped by semester with GPA/CGPA summary
export async function GET(request) {
  try {
    const authResult = verifyToken(request)
    if (!authResult.success || !authResult.studentId) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const semester = searchParams.get('semester')
    const latestOnly = searchParams.get('latest') === 'true'

    const client = await clientPromise
    const db = client.db('gradesynce')

    const studentObjectId = new ObjectId(authResult.studentId)

    // Base filter for student_results
    const resultFilter = { studentId: studentObjectId }
    if (semester) resultFilter.semester = semester

    const pipeline = [
      { $match: resultFilter },
      // Attach courses for each semester from registrations, masking grades when not published
      {
        $lookup: {
          from: 'courseregistrations',
          let: { sem: '$semester' },
          pipeline: [
            { $match: { studentId: studentObjectId } },
            { $match: { $expr: { $eq: ['$semester', '$$sem'] } } },
            {
              $lookup: {
                from: 'courses',
                localField: 'courseId',
                foreignField: '_id',
                as: 'course'
              }
            },
            { $unwind: '$course' },
            {
              $project: {
                _id: 1,
                registrationDate: 1,
                status: 1,
                grade: { $cond: [{ $eq: ['$isPublished', true] }, '$grade', null] },
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
          ],
          as: 'courses'
        }
      },
      {
        $project: {
          _id: 0,
          semester: '$semester',
          summary: {
            gpa: '$gpa',
            cgpa: '$cgpa',
            totalUnits: '$totalUnits',
            totalWeightedPoints: '$totalWeightedPoints',
            computedAt: '$computedAt'
          },
          courses: '$courses'
        }
      },
      { $sort: { 'summary.computedAt': -1 } }
    ]

    let results = await db.collection('student_results').aggregate(pipeline).toArray()

    if (latestOnly && results.length > 0) {
      results = results.slice(0, 1)
    }

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error('Error fetching student results:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch results', error: error.message },
      { status: 500 }
    )
  }
}