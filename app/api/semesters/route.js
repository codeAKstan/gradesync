import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('gradesynce')
    
    // Fetch all active semesters
    const semesters = await db.collection('semesters')
      .find({ isActive: true })
      .sort({ startDate: -1 })
      .toArray()
    
    return NextResponse.json({
      success: true,
      data: semesters
    })

  } catch (error) {
    console.error('Error fetching semesters:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch semesters',
        error: error.message 
      },
      { status: 500 }
    )
  }
}