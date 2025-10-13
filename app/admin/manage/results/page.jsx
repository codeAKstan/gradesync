'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function ResultsApprovalPage() {
  const router = useRouter()
  const [courses, setCourses] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedSemesterName, setSelectedSemesterName] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchInitialData(token)
  }, [])

  const fetchInitialData = async (token) => {
    try {
      const [coursesRes, semestersRes] = await Promise.all([
        fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/semesters', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!coursesRes.ok || !semestersRes.ok) throw new Error('Failed to fetch filters')
      const coursesData = await coursesRes.json()
      const semestersData = await semestersRes.json()
      setCourses(coursesData.data || [])
      setSemesters(semestersData.data || [])
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to load data', variant: 'destructive' })
    }
  }

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const url = new URL('/api/admin/course-registrations', window.location.origin)
      url.searchParams.set('courseId', selectedCourseId)
      if (selectedSemesterName) url.searchParams.set('semester', selectedSemesterName)
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to fetch registrations')
      const data = await res.json()
      setRegistrations(data.data || [])
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Unable to load registrations', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const approveAndPublish = async () => {
    if (!selectedCourseId || !selectedSemesterName) {
      toast({ title: 'Missing filters', description: 'Select course and semester', variant: 'destructive' })
      return
    }
    try {
      setApproving(true)
      const token = localStorage.getItem('adminToken')
      const url = new URL('/api/admin/results/approve', window.location.origin)
      url.searchParams.set('courseId', selectedCourseId)
      url.searchParams.set('semester', selectedSemesterName)
      const res = await fetch(url.toString(), { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const resp = await res.json()
      if (!res.ok) throw new Error(resp.message || 'Approval failed')
      toast({ title: 'Success', description: resp.message || 'Results approved and published' })
      fetchRegistrations()
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to approve results', variant: 'destructive' })
    } finally {
      setApproving(false)
    }
  }

  const gradeBadge = (reg) => {
    const published = reg.isPublished === true
    const showGrade = published ? reg.grade : null
    return (
      <Badge variant={showGrade ? 'default' : 'secondary'}>
        {showGrade || '-'}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Results Approval</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course</label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.code} - {c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Semester</label>
              <Select value={selectedSemesterName} onValueChange={setSelectedSemesterName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map(s => (
                    <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchRegistrations} disabled={!selectedCourseId}>
                Load Registrations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <span className="text-sm text-muted-foreground">{registrations.length} records</span>
                </div>
                <Button onClick={approveAndPublish} disabled={approving || registrations.length === 0 || !selectedSemesterName}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve & Publish
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matric</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Approval</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map(reg => (
                    <TableRow key={reg._id}>
                      <TableCell>{reg.student?.matricNumber}</TableCell>
                      <TableCell>{reg.student ? `${reg.student.lastName} ${reg.student.firstName}` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={reg.status === 'completed' ? 'default' : 'secondary'}>
                          {reg.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{gradeBadge(reg)}</TableCell>
                      <TableCell>
                        <Badge variant={reg.approvalStatus === 'approved' ? 'default' : 'secondary'}>
                          {reg.approvalStatus || 'pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}