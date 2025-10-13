"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, GraduationCap, BookOpen } from 'lucide-react'

export default function StudentResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null

    if (!token || userType !== 'student') {
      router.push('/')
      return
    }

    // Fetch active semesters for selection
    fetch('/api/semesters')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data?.data) ? data.data : []
        setSemesters(list)
        if (list.length > 0) {
          setSelectedSemester(list[0].name)
        }
      })
      .catch(err => {
        console.error('Failed to load semesters', err)
      })
  }, [router])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null
    if (!token || userType !== 'student') return

    async function loadResults() {
      setLoading(true)
      setError(null)
      try {
        const url = selectedSemester ? `/api/student/results?semester=${encodeURIComponent(selectedSemester)}` : '/api/student/results'
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (!json.success) {
          throw new Error(json.message || 'Unable to fetch results')
        }
        setResults(Array.isArray(json.data) ? json.data : [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [selectedSemester])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <GraduationCap className="w-6 h-6 text-green-600" />
          <span>View Results</span>
        </h1>
        <p className="text-muted-foreground">Check your grades and academic performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Filter by Semester</CardTitle>
            <CardDescription>Select a semester to view results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => (
                    <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => router.push('/student/course-registration')}>
                <BookOpen className="w-4 h-4 mr-2" /> Register Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center"><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading results...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="p-6">No results found for the selected semester.</CardContent>
        </Card>
      ) : (
        results.map((r) => (
          <Card key={r.semester} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{r.semester}</span>
                <span className="text-sm text-muted-foreground">Computed: {r.summary?.computedAt ? new Date(r.summary.computedAt).toLocaleString() : 'N/A'}</span>
              </CardTitle>
              <CardDescription>
                GPA: <span className="font-semibold">{r.summary?.gpa ?? 'N/A'}</span> · CGPA: <span className="font-semibold">{r.summary?.cgpa ?? 'N/A'}</span> · Units: {r.summary?.totalUnits ?? 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(r.courses) && r.courses.length > 0 ? (
                    r.courses.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell>{c.course?.title}</TableCell>
                        <TableCell>{c.course?.code}</TableCell>
                        <TableCell>{c.course?.creditUnits}</TableCell>
                        <TableCell className="capitalize">{c.status || 'registered'}</TableCell>
                        <TableCell>{c.grade ?? 'Pending'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No course data available.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}