import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

export async function POST(request) {
  try {
    // Verify student authentication
    const authResult = verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const { courseIds, level, semester } = await request.json()
    
    // Validate required fields
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Course IDs are required' },
        { status: 400 }
      )
    }
    
    if (!level || !semester) {
      return NextResponse.json(
        { success: false, message: 'Level and semester are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('gradesynce')
    
    // Get student ID from the authenticated token
    const studentId = new ObjectId(authResult.userId)
    
    // Validate that all courses exist and match the level/semester
    const courses = await db.collection('courses').find({
      _id: { $in: courseIds.map(id => new ObjectId(id)) },
      level: parseInt(level),
      semester: semester
    }).toArray()
    
    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { success: false, message: 'Some courses are invalid or not available for the selected level/semester' },
        { status: 400 }
      )
    }
    
    // Check for existing registrations to prevent duplicates
    const existingRegistrations = await db.collection('courseregistrations').find({
      studentId: studentId,
      courseId: { $in: courseIds.map(id => new ObjectId(id)) }
    }).toArray()
    
    if (existingRegistrations.length > 0) {
      return NextResponse.json(
        { success: false, message: 'You are already registered for some of these courses' },
        { status: 400 }
      )
    }
    
    // Create registration records
    const registrations = courseIds.map(courseId => ({
      studentId: studentId,
      courseId: new ObjectId(courseId),
      semester: semester,
      level: parseInt(level),
      registrationDate: new Date(),
      status: 'active'
    }))
    
    const result = await db.collection('courseregistrations').insertMany(registrations)
    
    return NextResponse.json({
      success: true,
      message: `Successfully registered for ${result.insertedCount} course(s)`,
      data: {
        registeredCourses: result.insertedCount,
        registrationIds: Object.values(result.insertedIds)
      }
    })

  } catch (error) {
    console.error('Error registering for courses:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to register for courses',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    // Verify student authentication
    const authResult = verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const semester = searchParams.get('semester')
    
    const client = await clientPromise
    const db = client.db('gradesynce')
    
    // Build query filter - use authenticated student ID
    const filter = { studentId: new ObjectId(authResult.userId) }
    if (semester) {
      filter.semester = semester
    }
    
    // Fetch registrations with course details
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'course.departmentId',
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
        $lookup: {
          from: 'semesters',
          localField: 'semesterId',
          foreignField: '_id',
          as: 'semester'
        }
      },
      {
        $unwind: {
          path: '$semester',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          registrationDate: 1,
          status: 1,
          grade: 1,
          course: {
            _id: '$course._id',
            title: '$course.title',
            code: '$course.code',
            creditUnits: '$course.creditUnits',
            level: '$course.level'
          },
          department: {
            name: '$department.name',
            code: '$department.code'
          },
          semester: {
            name: '$semester.name',
            _id: '$semester._id'
          }
        }
      },
      { $sort: { registrationDate: -1 } }
    ]
    
    const registrations = await db.collection('courseregistrations').aggregate(pipeline).toArray()
    
    return NextResponse.json({
      success: true,
      data: registrations
    })

  } catch (error) {
    console.error('Error fetching course registrations:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch course registrations',
        error: error.message 
      },
      { status: 500 }
    )
  }
}