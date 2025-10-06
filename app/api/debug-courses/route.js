import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('gradesynce')
    
    // Get raw course data
    const courses = await db.collection('courses').find({}).limit(5).toArray()
    
    // Get semester data
    const semesters = await db.collection('semesters').find({}).toArray()
    
    return NextResponse.json({
      success: true,
      courses: courses.map(course => ({
        _id: course._id,
        title: course.title,
        code: course.code,
        semester: course.semester,
        semesterType: typeof course.semester,
        semesterIsObjectId: course.semester && course.semester.constructor.name === 'ObjectId'
      })),
      semesters: semesters.map(sem => ({
        _id: sem._id,
        name: sem.name,
        code: sem.code
      }))
    })

  } catch (error) {
    console.error('Debug courses error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch debug data',
        error: error.message 
      },
      { status: 500 }
    )
  }
}