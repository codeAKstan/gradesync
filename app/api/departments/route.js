import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Department } from '@/models/Department'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('gradesynce') // Fixed database name to match connection string
    
    // Fetch all active departments, sorted by name
    const departments = await db.collection('departments')
      .find({ $or: [{ isActive: true }, { isActive: { $exists: false } }] })
      .sort({ name: 1 })
      .toArray()

    // Transform the data to include only necessary fields for the dropdown
    const departmentOptions = departments.map(dept => ({
      id: dept._id.toString(),
      name: dept.name,
      code: dept.code
    }))

    return NextResponse.json({
      success: true,
      departments: departmentOptions
    })

  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch departments' 
      },
      { status: 500 }
    )
  }
}