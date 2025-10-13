import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'
import { mapScoreToGrade, validateMatricNumberFormat } from '@/lib/grades'

// Simple CSV parser for small files: splits by newlines and commas
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return { header: [], rows: [] }
  const header = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim()))
  return { header, rows }
}

export async function POST(request) {
  try {
    const authResult = verifyToken(request)
    if (!authResult.success || authResult.type !== 'lecturer' || !authResult.lecturerId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const semesterId = searchParams.get('semesterId')
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

    // Read raw text; assume text/csv uploaded as body
    const contentType = request.headers.get('content-type') || ''
    const isText = contentType.includes('text/plain') || contentType.includes('text/csv')
    const bodyText = isText ? await request.text() : ''
    if (!bodyText) {
      return NextResponse.json({ success: false, message: 'No CSV content received' }, { status: 400 })
    }

    const { header, rows } = parseCsv(bodyText)
    const expectedHeader = ['CourseCode', 'MatricNumber', 'StudentName', 'Score']
    const headerMismatch = expectedHeader.some((h, i) => (header[i] || '').toLowerCase() !== h.toLowerCase())
    if (headerMismatch) {
      return NextResponse.json({ success: false, message: 'Invalid CSV header format' }, { status: 400 })
    }

    const errors = []
    const seen = new Set()
    const updates = []

    // Build registration map for quick lookup
    const regs = await db.collection('courseregistrations').aggregate([
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
          matricNumber: '$student.matricNumber'
        }
      }
    ]).toArray()

    const regByMatric = new Map(regs.map(r => [String(r.matricNumber).trim(), r]))

    // Validate each row
    rows.forEach((cols, idx) => {
      const rowNumber = idx + 2 // account for header line
      const [code, matricNumber, studentName, scoreStr] = cols
      const rowErrors = []

      // Validate course code
      if ((code || '').trim() !== courseDoc.code) {
        rowErrors.push({ row: rowNumber, field: 'CourseCode', message: 'Incorrect course code' })
      }

      // Validate matric format
      if (!validateMatricNumberFormat(matricNumber)) {
        rowErrors.push({ row: rowNumber, field: 'MatricNumber', message: 'Invalid matric number format' })
      }

      const key = String(matricNumber || '').trim()
      if (seen.has(key)) {
        rowErrors.push({ row: rowNumber, field: 'MatricNumber', message: 'Duplicate matric number in CSV' })
      } else {
        seen.add(key)
      }

      // Verify that this matric is registered for the course+semester
      const reg = regByMatric.get(key)
      if (!reg) {
        rowErrors.push({ row: rowNumber, field: 'MatricNumber', message: 'Matric not registered for this course/semester' })
      }

      const scoreNum = Number(scoreStr)
      if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        rowErrors.push({ row: rowNumber, field: 'Score', message: 'Score must be a number between 0 and 100' })
      }

      if (rowErrors.length === 0) {
        const { grade, gradePoint } = mapScoreToGrade(scoreNum)
        if (grade === null) {
          rowErrors.push({ row: rowNumber, field: 'Score', message: 'Unable to map score to grade' })
        } else if (reg) {
          updates.push({ _id: reg._id, update: { grade, gradePoint } })
        }
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
      }
    })

    if (errors.length > 0) {
      return NextResponse.json({ success: false, message: 'Validation errors', errors }, { status: 400 })
    }

    // Apply updates in bulk
    if (updates.length > 0) {
      const bulkOps = updates.map(u => ({
        updateOne: {
          filter: { _id: u._id },
          update: { $set: { grade: u.update.grade, gradePoint: u.update.gradePoint, updatedAt: new Date(), status: 'completed' } }
        }
      }))
      await db.collection('courseregistrations').bulkWrite(bulkOps)
    }

    return NextResponse.json({ success: true, message: `Imported ${updates.length} scores`, imported: updates.length })

  } catch (error) {
    console.error('Upload CSV error:', error)
    return NextResponse.json({ success: false, message: 'Failed to process CSV upload' }, { status: 500 })
  }
}