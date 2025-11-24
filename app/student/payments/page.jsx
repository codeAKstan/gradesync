"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function StudentPaymentsPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('fees')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [payments, setPayments] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    if (!token || userType !== 'student') {
      router.push('/')
      return
    }
    fetchPayments()
  }, [router])

  async function fetchPayments() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/student/payments/list', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) setPayments(json.data || [])
    } catch (_) {}
  }

  async function startPayment() {
    setError('')
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/student/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount), purpose })
      })
      const json = await res.json()
      if (json.success) {
        window.location.href = json.data.authorizationUrl
      } else {
        setError(json.message || 'Failed to start payment')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Pay fees using Paystack</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New Payment</CardTitle>
          <CardDescription>Enter amount and purpose</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="amount">Amount (NGN)</Label>
              <Input id="amount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fees">Fees</SelectItem>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={startPayment} disabled={loading || !amount}>Pay with Paystack</Button>
            </div>
          </div>
          {error && <div className="text-red-600 mt-3">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments && payments.length > 0 ? payments.map(p => (
                <TableRow key={p.reference}>
                  <TableCell>{p.reference}</TableCell>
                  <TableCell>{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{p.status}</TableCell>
                  <TableCell>{p.purpose}</TableCell>
                  <TableCell>{p.paidAt ? new Date(p.paidAt).toLocaleString() : '-'}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No payments</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}