import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Course } from '@/models/Course'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const level = searchParams.get('level')
    const semester = searchParams.get('semester')

    const client = await clientPromise
    const db = client.db('gradesynce')
    
    // Build query filter
    const filter = { isActive: true }
    
    if (departmentId) {
      filter.departmentId = departmentId
    }
    
    if (level) {
      filter.level = parseInt(level)
    }
    
    if (semester) {
      filter.semester = parseInt(semester)
    }

    // Fetch courses with department information
    const courses = await db.collection('courses')
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'departments',
            localField: 'departmentId',
            foreignField: '_id',
            as: 'department'
          }
        },
        {
          $unwind: {
            path: '$department',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            code: 1,
            description: 1,
            creditUnits: 1,
            level: 1,
            semester: 1,
            prerequisites: 1,
            isElective: 1,
            'department.name': 1,
            'department.code': 1
          }
        },
        { $sort: { code: 1 } }
      ])
      .toArray()

    // Transform the data for frontend consumption
    const courseOptions = courses.map(course => ({
      id: course._id.toString(),
      title: course.title,
      code: course.code,
      description: course.description,
      creditUnits: course.creditUnits,
      level: course.level,
      semester: course.semester,
      prerequisites: course.prerequisites || [],
      isElective: course.isElective,
      department: course.department ? {
        name: course.department.name,
        code: course.department.code
      } : null
    }))

    return NextResponse.json({
      success: true,
      courses: courseOptions,
      total: courseOptions.length
    })

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch courses' 
      },
      { status: 500 }
    )
  }
}