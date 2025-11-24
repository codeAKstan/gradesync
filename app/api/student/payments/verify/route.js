export const dynamic = 'force-dynamic'
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

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')
    if (!reference) {
      return NextResponse.json({ success: false, message: 'Missing reference' }, { status: 400 })
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    })
    const json = await res.json()

    const client = await clientPromise
    const db = client.db('gradesynce')

    const status = json.status && json.data && json.data.status === 'success' ? 'success' : 'failed'

    const update = {
      status,
      updatedAt: new Date()
    }

    if (json.data) {
      update.gatewayResponse = json.data.gateway_response
      update.transactionId = json.data.id
      update.channel = json.data.channel
      update.paidAt = json.data.paid_at ? new Date(json.data.paid_at) : null
      update.amount = json.data.amount ? json.data.amount / 100 : undefined
      update.currency = json.data.currency || 'NGN'
    }

    await db.collection('payments').updateOne(
      { reference, studentId: new ObjectId(auth.studentId) },
      { $set: update }
    )

    if (status === 'success') {
      await db.collection('studentactivities').insertOne({
        studentId: new ObjectId(auth.studentId),
        activityType: 'payment',
        title: 'Payment Successful',
        description: `Reference ${reference}`,
        timestamp: new Date()
      })
    }

    const payment = await db.collection('payments').findOne({ reference, studentId: new ObjectId(auth.studentId) })

    return NextResponse.json({ success: status === 'success', data: payment, message: json.message })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}