import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Course } from '@/models/Course'
import { ObjectId } from 'mongodb'

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
    
    // Handle semester filtering - find semester ObjectId by name
    let semesterObjectId = null
    if (semester) {
      const semesterDoc = await db.collection('semesters').findOne({ 
        name: semester === "First" ? "First Semester" : semester === "Second" ? "Second Semester" : semester 
      })
      if (semesterDoc) {
        semesterObjectId = semesterDoc._id
        filter.semester = semesterObjectId
      }
    }

    // Fetch courses with department and semester information
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
          $lookup: {
            from: 'semesters',
            let: { semesterId: '$semester' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      // Handle string ObjectIds
                      {
                        $and: [
                          { $eq: [{ $type: '$$semesterId' }, 'string'] },
                          { $eq: ['$_id', { $toObjectId: '$$semesterId' }] }
                        ]
                      },
                      // Handle numeric semester codes
                      {
                        $and: [
                          { $eq: [{ $type: '$$semesterId' }, 'number'] },
                          { $eq: ['$code', '$$semesterId'] }
                        ]
                      }
                    ]
                  }
                }
              }
            ],
            as: 'semesterInfo'
          }
        },
        {
          $unwind: {
            path: '$department',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$semesterInfo',
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
            'department.code': 1,
            'semesterInfo.name': 1,
            'semesterInfo.code': 1
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
      semester: course.semester, // Keep the ObjectId for filtering
      semesterName: course.semesterInfo ? course.semesterInfo.name : null, // Add readable semester name
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