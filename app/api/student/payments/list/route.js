import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (!auth.success || !auth.studentId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    const client = await clientPromise
    const db = client.db('gradesynce')
    const payments = await db.collection('payments').find({ studentId: new ObjectId(auth.studentId) }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ success: true, data: payments })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}