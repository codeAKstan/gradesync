export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'
import { Payment } from '@/models/Payment'

export async function POST(request) {
  try {
    const auth = verifyToken(request)
    if (!auth.success || !auth.studentId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, purpose } = body
    const amountNumber = Number(amount)
    if (!amountNumber || amountNumber <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('gradesynce')

    const studentDoc = await db.collection('students').findOne({ _id: new ObjectId(auth.studentId) })
    if (!studentDoc) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 })
    }

    const origin = new URL(request.url).origin
    const callbackUrl = `${origin}/student/payments/callback`

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: studentDoc.email,
        amount: Math.round(amountNumber * 100),
        callback_url: callbackUrl,
        metadata: { studentId: auth.studentId, purpose: purpose || 'fees' }
      })
    })

    const json = await res.json()
    if (!json.status || !json.data) {
      return NextResponse.json({ success: false, message: json.message || 'Payment init failed' }, { status: 400 })
    }

    const payment = new Payment({
      studentId: new ObjectId(auth.studentId),
      reference: json.data.reference,
      status: 'initialized',
      amount: amountNumber,
      currency: 'NGN',
      purpose: purpose || 'fees',
      authorizationUrl: json.data.authorization_url,
      metadata: { email: studentDoc.email }
    })

    const validation = payment.validate()
    if (!validation.isValid) {
      return NextResponse.json({ success: false, message: 'Validation failed', errors: validation.errors }, { status: 400 })
    }

    await db.collection('payments').insertOne(payment.toObject())

    return NextResponse.json({ success: true, data: { authorizationUrl: json.data.authorization_url, reference: json.data.reference } })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}