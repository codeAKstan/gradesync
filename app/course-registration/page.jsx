"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  ArrowLeft,
  Filter
} from "lucide-react"

export default function CourseRegistration() {
  const [student, setStudent] = useState(null)
  const [courses, setCourses] = useState([])
  const [registeredCourses, setRegisteredCourses] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [filters, setFilters] = useState({
    level: 'all',
    semester: 'all'
  })
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    const userType = localStorage.getItem('userType')

    if (!token || userType !== 'student') {
      router.push('/login')
      return
    }

    if (userData) {
      setStudent(JSON.parse(userData))
    }

    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch available courses and registered courses in parallel
      const [coursesResponse, registrationsResponse] = await Promise.all([
        fetch('/api/courses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/course-registration', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ])

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData.courses || [])
      }

      if (registrationsResponse.ok) {
        const registrationsData = await registrationsResponse.json()
        setRegisteredCourses(registrationsData.registrations || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load course data'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSelection = (courseId, checked) => {
    if (checked) {
      setSelectedCourses([...selectedCourses, courseId])
    } else {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId))
    }
  }

  const handleRegister = async () => {
    if (selectedCourses.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select at least one course to register'
      })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/course-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseIds: selectedCourses
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        })
        setSelectedCourses([])
        // Refresh data
        fetchData()
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Registration failed'
        })
      }

    } catch (error) {
      console.error('Error registering courses:', error)
      setMessage({
        type: 'error',
        text: 'Failed to register courses'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDropCourse = async (registrationId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/course-registration?registrationId=${registrationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        })
        // Refresh data
        fetchData()
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to drop course'
        })
      }

    } catch (error) {
      console.error('Error dropping course:', error)
      setMessage({
        type: 'error',
        text: 'Failed to drop course'
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    router.push('/login')
  }

  // Filter courses based on selected filters
  const filteredCourses = courses.filter(course => {
    if (filters.level && filters.level !== 'all' && course.level !== parseInt(filters.level)) return false
    if (filters.semester && filters.semester !== 'all' && course.semester !== filters.semester) return false
    return true
  })

  // Check if course is already registered
  const isRegistered = (courseId) => {
    return registeredCourses.some(reg => reg.course._id === courseId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="border-l pl-3">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Course Registration</h1>
                <p className="text-sm text-gray-500">Select and register for courses</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Alert */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters and Registration Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Level</label>
                  <Select value={filters.level} onValueChange={(value) => setFilters({...filters, level: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="100">100 Level</SelectItem>
                      <SelectItem value="200">200 Level</SelectItem>
                      <SelectItem value="300">300 Level</SelectItem>
                      <SelectItem value="400">400 Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Semester</label>
                  <Select value={filters.semester} onValueChange={(value) => setFilters({...filters, semester: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      <SelectItem value="First">First Semester</SelectItem>
                      <SelectItem value="Second">Second Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Registration Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Registration Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Selected Courses:</span>
                    <Badge variant="outline">{selectedCourses.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Registered Courses:</span>
                    <Badge variant="secondary">{registeredCourses.length}</Badge>
                  </div>
                  <div className="pt-3">
                    <Button 
                      onClick={handleRegister}
                      disabled={selectedCourses.length === 0 || submitting}
                      className="w-full"
                    >
                      {submitting ? 'Registering...' : `Register ${selectedCourses.length} Course(s)`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Currently Registered Courses */}
            {registeredCourses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>Registered Courses</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {registeredCourses.map((registration) => (
                      <div key={registration._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{registration.course.code}</p>
                          <p className="text-xs text-gray-600">{registration.course.title}</p>
                          <p className="text-xs text-gray-500">{registration.course.creditUnits} units</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDropCourse(registration._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Drop
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Available Courses */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Available Courses</span>
                </CardTitle>
                <CardDescription>
                  Select courses to register for the current semester
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No courses available</p>
                    <p className="text-sm text-gray-400">
                      Try adjusting your filters or contact your department
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCourses.map((course) => {
                      const registered = isRegistered(course._id)
                      const selected = selectedCourses.includes(course._id)
                      
                      return (
                        <div 
                          key={course._id} 
                          className={`p-4 border rounded-lg ${registered ? 'bg-green-50 border-green-200' : selected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {!registered && (
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={(checked) => handleCourseSelection(course._id, checked)}
                                  className="mt-1"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-gray-900">{course.code}</h3>
                                  <Badge variant="outline">{course.creditUnits} units</Badge>
                                  <Badge variant="secondary">{course.level} Level</Badge>
                                  <Badge variant="outline">{course.semester} Semester</Badge>
                                  {course.isElective && <Badge variant="outline">Elective</Badge>}
                                </div>
                                <p className="text-gray-700 mb-2">{course.title}</p>
                                {course.description && (
                                  <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                                )}
                                {course.department && (
                                  <p className="text-xs text-gray-500">
                                    Department: {course.department.name}
                                  </p>
                                )}
                                {course.prerequisites && course.prerequisites.length > 0 && (
                                  <p className="text-xs text-gray-500">
                                    Prerequisites: {course.prerequisites.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                            {registered && (
                              <Badge className="bg-green-100 text-green-800">
                                Registered
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}