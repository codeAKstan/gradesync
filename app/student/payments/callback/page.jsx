"use client"
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PaymentCallbackPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const ref = params.get('reference')
    if (!ref) return
    verify(ref)
  }, [params])

  async function verify(reference) {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/student/payments/verify?reference=${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    setStatus(json.success ? 'success' : 'failed')
    setMessage(json.message || '')
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment {status ? status : 'processing'}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/student/payments')}>Back to Payments</Button>
        </CardContent>
      </Card>
    </div>
  )
}