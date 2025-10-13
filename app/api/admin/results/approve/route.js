import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

// Compute GPA for a student in a semester
async function computeSemesterGPA(db, studentId, semesterName) {
  const regs = await db.collection('courseregistrations').aggregate([
    { $match: { studentId: new ObjectId(studentId), semester: semesterName, status: 'completed' } },
    { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
    { $unwind: '$course' },
    { $project: { gradePoint: 1, creditUnits: '$course.creditUnits' } }
  ]).toArray()

  let totalUnits = 0
  let totalWeighted = 0
  for (const r of regs) {
    const units = Number(r.creditUnits || 0)
    const gp = Number(r.gradePoint || 0)
    totalUnits += units
    totalWeighted += gp * units
  }
  const gpa = totalUnits > 0 ? Number((totalWeighted / totalUnits).toFixed(2)) : null
  return { gpa, totalUnits, totalWeightedPoints: totalWeighted }
}

// Compute CGPA across all semesters
async function computeCGPA(db, studentId) {
  const regs = await db.collection('courseregistrations').aggregate([
    { $match: { studentId: new ObjectId(studentId), status: 'completed' } },
    { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
    { $unwind: '$course' },
    { $project: { gradePoint: 1, creditUnits: '$course.creditUnits' } }
  ]).toArray()

  let totalUnits = 0
  let totalWeighted = 0
  for (const r of regs) {
    const units = Number(r.creditUnits || 0)
    const gp = Number(r.gradePoint || 0)
    totalUnits += units
    totalWeighted += gp * units
  }
  const cgpa = totalUnits > 0 ? Number((totalWeighted / totalUnits).toFixed(2)) : null
  return { cgpa }
}

export async function POST(request) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success || !(authResult.role === 'admin' || authResult.type === 'admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const semester = searchParams.get('semester') // name-based

    if (!courseId || !ObjectId.isValid(courseId)) {
      return NextResponse.json({ success: false, message: 'Invalid courseId' }, { status: 400 })
    }
    if (!semester) {
      return NextResponse.json({ success: false, message: 'semester name is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('gradesynce')

    // Find all completed registrations for this course+semester
    const regs = await db.collection('courseregistrations').find({
      courseId: new ObjectId(courseId),
      semester,
      status: 'completed'
    }).toArray()

    if (regs.length === 0) {
      return NextResponse.json({ success: false, message: 'No completed registrations to approve' }, { status: 400 })
    }

    // Mark as approved/published
    await db.collection('courseregistrations').updateMany(
      { courseId: new ObjectId(courseId), semester, status: 'completed' },
      { $set: { approvalStatus: 'approved', isPublished: true, approvedBy: new ObjectId(authResult.adminId), approvedAt: new Date(), updatedAt: new Date() } }
    )

    // Compute GPA per student for this semester and upsert StudentResult
    const studentIds = [...new Set(regs.map(r => r.studentId.toString()))]
    const resultsCollection = db.collection('student_results')

    const upserts = []
    for (const sid of studentIds) {
      const { gpa, totalUnits, totalWeightedPoints } = await computeSemesterGPA(db, sid, semester)
      const { cgpa } = await computeCGPA(db, sid)
      upserts.push({
        updateOne: {
          filter: { studentId: new ObjectId(sid), semester },
          update: {
            $set: {
              studentId: new ObjectId(sid),
              semester,
              gpa,
              totalUnits,
              totalWeightedPoints,
              cgpa,
              updatedAt: new Date(),
              computedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() }
          },
          upsert: true
        }
      })
    }

    if (upserts.length > 0) {
      await resultsCollection.bulkWrite(upserts)
    }

    return NextResponse.json({ success: true, message: 'Results approved and published', approvedCount: regs.length, studentsUpdated: studentIds.length })
  } catch (error) {
    console.error('Approve results error:', error)
    return NextResponse.json({ success: false, message: 'Failed to approve results' }, { status: 500 })
  }
}