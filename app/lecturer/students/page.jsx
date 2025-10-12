"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, ArrowLeft } from "lucide-react"

export default function LecturerStudentsPage() {
  const router = useRouter()
  const params = useSearchParams()
  const initialCourseId = params.get('courseId')
  const initialSemesterId = params.get('semesterId')

  const [loading, setLoading] = useState(true)
  const [assignedCourses, setAssignedCourses] = useState([])
  const [courseId, setCourseId] = useState(initialCourseId || '')
  const [semesterId, setSemesterId] = useState(initialSemesterId || '')
  const [students, setStudents] = useState([])
  const [error, setError] = useState(null)

  const token = useMemo(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('lecturerToken') : null
  }, [])

  useEffect(() => {
    if (!token) {
      router.replace('/lecturer/login')
      return
    }

    const fetchAssigned = async () => {
      try {
        const res = await fetch('/api/lecturer/assigned-courses', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok && data.success) {
          setAssignedCourses(data.data || [])
        }
      } catch (err) {
        // ignore
      }
    }

    fetchAssigned()
  }, [router, token])

  useEffect(() => {
    const loadStudents = async () => {
      if (!token || !courseId) return
      setLoading(true)
      try {
        const qs = new URLSearchParams()
        qs.set('courseId', courseId)
        if (semesterId) qs.set('semesterId', semesterId)
        const res = await fetch(`/api/lecturer/course-students?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok && data.success) {
          setStudents(data.data || [])
          setError(null)
        } else {
          setError(data.message || 'Failed to load students')
        }
      } catch (err) {
        setError('Error loading students')
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [courseId, semesterId, token])

  const availableSemesters = useMemo(() => {
    const sel = assignedCourses.find(a => a.course?._id === courseId)
    return sel?.semester?._id ? [{ _id: sel.semester._id, name: sel.semester.name }] : []
  }, [assignedCourses, courseId])

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Students</h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Course Filters
          </CardTitle>
          <CardDescription>
            Select a course to view registered students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Course</label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {assignedCourses.map(a => (
                    <SelectItem key={a.course?._id} value={a.course?._id}>
                      {a.course?.title} ({a.course?.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Semester</label>
              <Select value={semesterId} onValueChange={setSemesterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {availableSemesters.map(s => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-600 mb-4">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registered Students</CardTitle>
          <CardDescription>
            {students.length} student{students.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!courseId ? (
            <div className="text-muted-foreground">Select a course to view students</div>
          ) : students.length === 0 ? (
            <div className="text-muted-foreground">No students found for this selection.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Matric No.</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((st) => (
                  <TableRow key={st._id}>
                    <TableCell className="font-medium">
                      {st.student?.firstName} {st.student?.lastName}
                    </TableCell>
                    <TableCell>{st.student?.matricNumber || '—'}</TableCell>
                    <TableCell>{st.student?.department || '—'}</TableCell>
                    <TableCell>{st.level || '—'}</TableCell>
                    <TableCell>{st.semester || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={st.status === 'active' || st.status === 'registered' ? 'default' : 'secondary'}>
                        {st.status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>{st.grade || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}