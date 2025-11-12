export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const semesterId = searchParams.get('semesterId')

    const authResult = verifyToken(request)
    if (!authResult.success || authResult.type !== 'lecturer' || !authResult.lecturerId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (!courseId || !ObjectId.isValid(courseId)) {
      return NextResponse.json({ success: false, message: 'Invalid or missing courseId' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('gradesynce')

    // Resolve semester name
    let semesterName = null
    if (semesterId && ObjectId.isValid(semesterId)) {
      const semesterDoc = await db.collection('semesters').findOne({ _id: new ObjectId(semesterId) })
      semesterName = semesterDoc?.name || null
    } else {
      // Fallback to lecturer assignment active semester
      const assignment = await db.collection('course_assignments').findOne({
        lecturerId: new ObjectId(authResult.lecturerId),
        courseId: new ObjectId(courseId),
        isActive: true
      })
      if (assignment?.semesterId) {
        const semesterDoc = await db.collection('semesters').findOne({ _id: assignment.semesterId })
        semesterName = semesterDoc?.name || null
      }
    }

    if (!semesterName) {
      return NextResponse.json({ success: false, message: 'Semester not determined' }, { status: 400 })
    }

    const courseDoc = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
    if (!courseDoc) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 })
    }

    // Aggregate registered students for the course & semester
    const pipeline = [
      { $match: { courseId: new ObjectId(courseId), semester: semesterName } },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          _id: 1,
          studentName: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
          matricNumber: '$student.matricNumber'
        }
      },
      { $sort: { matricNumber: 1 } }
    ]

    const regs = await db.collection('courseregistrations').aggregate(pipeline).toArray()

    // Build CSV content with separate CA and Exam columns
    const header = 'CourseCode,MatricNumber,StudentName,CA,Exam\n'
    const rows = regs.map(r => {
      const name = (r.studentName || '').replace(/\r|\n/g, ' ').trim()
      const matric = (r.matricNumber || '').trim()
      // Leave CA and Exam empty for lecturers to fill
      return `${courseDoc.code},${matric},${name},,`
    })
    const csv = header + rows.join('\n') + (rows.length ? '\n' : '')

    const filename = `scores_template_${courseDoc.code}_${semesterName.replace(/\s+/g, '-')}.csv`
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Template CSV error:', error)
    return NextResponse.json({ success: false, message: 'Failed to generate template' }, { status: 500 })
  }
}