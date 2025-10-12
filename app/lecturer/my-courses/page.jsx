"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, GraduationCap, ArrowLeft } from "lucide-react"

export default function LecturerMyCoursesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [assigned, setAssigned] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lecturerToken') : null
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
          setAssigned(data.data || [])
        } else {
          setError(data.message || 'Failed to load assigned courses')
        }
      } catch (err) {
        setError('Error loading assigned courses')
      } finally {
        setLoading(false)
      }
    }

    fetchAssigned()
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">My Courses</h1>
        </div>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">My Courses</h1>
      </div>

      {error && (
        <div className="text-red-600 mb-4">{error}</div>
      )}

      {!assigned || assigned.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Assigned Courses</CardTitle>
            <CardDescription>
              You currently have no course assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">Please contact your administrator.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assigned.map((a) => (
            <Card key={a._id} className="border-border hover:shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {a.course?.title} ({a.course?.code})
                </CardTitle>
                <CardDescription>
                  Level {a.course?.level} • Semester {a.semester?.name || '—'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {a.academicSession && (
                      <div className="text-sm text-muted-foreground">
                        Session: {a.academicSession.startYear}-{a.academicSession.endYear}
                      </div>
                    )}
                    {a.semester?.name && (
                      <Badge variant="secondary">{a.semester.name}</Badge>
                    )}
                  </div>
                  <Link href={`/lecturer/students?courseId=${a.course?._id}${a.semester?._id ? `&semesterId=${a.semester._id}` : ''}`}>
                    <Button>
                      <GraduationCap className="h-4 w-4 mr-2" />
                      View Students
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}