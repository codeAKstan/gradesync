import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { CourseRegistration } from '@/models/CourseRegistration'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Fetch student's registered courses
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db('gradesynce')
    
    // Fetch student's course registrations with course details
    const registrations = await db.collection('courseregistrations')
      .aggregate([
        { 
          $match: { 
            studentId: new ObjectId(decoded.userId),
            status: 'registered'
          }
        },
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
          $project: {
            _id: 1,
            registrationDate: 1,
            status: 1,
            'course._id': 1,
            'course.title': 1,
            'course.code': 1,
            'course.creditUnits': 1,
            'course.level': 1,
            'course.semester': 1,
            'department.name': 1,
            'department.code': 1
          }
        },
        { $sort: { 'course.code': 1 } }
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      registrations: registrations
    })

  } catch (error) {
    console.error('Error fetching course registrations:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}

// POST - Register for courses
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const { courseIds, academicSessionId, semesterId } = await request.json()

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Course IDs are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('gradesynce')
    
    // Get student information
    const student = await db.collection('students').findOne({
      _id: new ObjectId(decoded.userId)
    })

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      )
    }

    // Get courses information
    const courses = await db.collection('courses')
      .find({ 
        _id: { $in: courseIds.map(id => new ObjectId(id)) },
        isActive: true 
      })
      .toArray()

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { success: false, message: 'Some courses not found or inactive' },
        { status: 400 }
      )
    }

    // Get existing registrations for validation
    const existingRegistrations = await db.collection('courseregistrations')
      .find({
        studentId: new ObjectId(decoded.userId),
        status: 'registered'
      })
      .toArray()

    // Validate each course registration
    const validationErrors = []
    const registrationsToCreate = []

    for (const course of courses) {
      // Check if already registered
      const alreadyRegistered = existingRegistrations.some(reg => 
        reg.courseId.toString() === course._id.toString()
      )
      
      if (alreadyRegistered) {
        validationErrors.push(`Already registered for ${course.code}`)
        continue
      }

      // Create registration object
      const registration = new CourseRegistration({
        studentId: new ObjectId(decoded.userId),
        courseId: new ObjectId(course._id),
        academicSessionId: academicSessionId ? new ObjectId(academicSessionId) : null,
        semesterId: semesterId ? new ObjectId(semesterId) : null,
        registrationDate: new Date(),
        status: 'registered'
      })

      const validation = registration.validate()
      if (!validation.isValid) {
        validationErrors.push(`${course.code}: ${validation.errors.join(', ')}`)
        continue
      }

      registrationsToCreate.push(registration.toObject())
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation errors occurred',
          errors: validationErrors
        },
        { status: 400 }
      )
    }

    // Insert all registrations
    if (registrationsToCreate.length > 0) {
      await db.collection('courseregistrations').insertMany(registrationsToCreate)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully registered for ${registrationsToCreate.length} course(s)`,
      registeredCourses: registrationsToCreate.length
    })

  } catch (error) {
    console.error('Error registering for courses:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to register for courses' },
      { status: 500 }
    )
  }
}

// DELETE - Drop a course
export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const registrationId = searchParams.get('registrationId')

    if (!registrationId) {
      return NextResponse.json(
        { success: false, message: 'Registration ID is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('gradesynce')
    
    // Update registration status to dropped
    const result = await db.collection('courseregistrations').updateOne(
      { 
        _id: new ObjectId(registrationId),
        studentId: new ObjectId(decoded.userId),
        status: 'registered'
      },
      { 
        $set: { 
          status: 'dropped',
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Registration not found or already dropped' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Course dropped successfully'
    })

  } catch (error) {
    console.error('Error dropping course:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to drop course' },
      { status: 500 }
    )
  }
}