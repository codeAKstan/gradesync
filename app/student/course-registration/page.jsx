"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, BookOpen, GraduationCap, Calendar, CheckCircle2, AlertCircle, ArrowLeft, Users, Clock, Eye, EyeOff } from "lucide-react"

export default function CourseRegistrationPage() {
  const [loading, setLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [semesters, setSemesters] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("")
  const [selectedCourses, setSelectedCourses] = useState([])
  const [registeredCourses, setRegisteredCourses] = useState([])
  const [showRegisteredCourses, setShowRegisteredCourses] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const router = useRouter()

  const levels = [
    { value: '100', label: '100 Level' },
    { value: '200', label: '200 Level' },
    { value: '300', label: '300 Level' },
    { value: '400', label: '400 Level' }
  ]

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    
    if (!token || userType !== 'student') {
      router.push('/login')
      return
    }
    
    setAuthenticated(true)
    fetchSemesters()
    fetchRegisteredCourses()
  }, [router])

  // Fetch courses when level and semester are selected
  useEffect(() => {
    if (selectedLevel && selectedSemester) {
      fetchCourses()
    }
  }, [selectedLevel, selectedSemester])

  const fetchRegisteredCourses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/student/course-registration', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        setRegisteredCourses(data.data || [])
      } else {
        console.error('Failed to fetch registered courses:', data.message)
      }
    } catch (error) {
      console.error('Error fetching registered courses:', error)
    }
  }

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/semesters')
      const data = await response.json()
      
      if (data.success) {
        setSemesters(data.data || [])
      } else {
        setMessage({ type: "error", text: data.message || "Failed to fetch semesters" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error fetching semesters" })
    }
  }

  const fetchCourses = async () => {
    if (!selectedLevel || !selectedSemester) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/courses?level=${selectedLevel}&semester=${selectedSemester}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setCourses(data.courses || [])
      } else {
        setMessage({ type: "error", text: data.message || "Failed to fetch courses" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error fetching courses" })
    } finally {
      setLoading(false)
    }
  }

  const handleCourseRegistration = async () => {
    if (selectedCourses.length === 0) {
      setMessage({ type: "error", text: "Please select at least one course" })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/student/course-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseIds: selectedCourses,
          level: selectedLevel,
          semester: selectedSemester
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: "success", text: data.message })
        setSelectedCourses([])
        // Refresh both available courses and registered courses
        fetchCourses()
        fetchRegisteredCourses()
      } else {
        setMessage({ type: "error", text: data.message || "Registration failed" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error during registration" })
    } finally {
      setLoading(false)
    }
  }

  const getTotalCreditUnits = () => {
    return courses
      .filter(course => selectedCourses.includes(course.id))
      .reduce((total, course) => total + course.creditUnits, 0)
  }

  const handleCourseSelection = (courseId, isSelected) => {
    if (isSelected) {
      setSelectedCourses([...selectedCourses, courseId])
    } else {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId))
    }
  }

  // Show loading or redirect if not authenticated
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Course Registration</h1>
          <p className="text-muted-foreground">Select your level and semester to view available courses</p>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <Alert className={message.type === "error" ? "border-destructive" : "border-green-500"}>
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Toggle Button for Registered Courses */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => setShowRegisteredCourses(!showRegisteredCourses)}
          className="flex items-center gap-2"
        >
          {showRegisteredCourses ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Registered Courses
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              View Registered Courses
            </>
          )}
        </Button>
      </div>

      {/* Registered Courses Section */}
      {showRegisteredCourses && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Registered Courses
            </CardTitle>
            <CardDescription>
              View your currently registered courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registeredCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No registered courses found</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Total Registered: {registeredCourses.length} course{registeredCourses.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Credit Units: {registeredCourses.reduce((total, course) => total + (course.course?.creditUnits || 0), 0)}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Credit Units</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registeredCourses.map((registration) => (
                      <TableRow key={registration._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{registration.course?.title || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{registration.course?.code || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{registration.department?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {registration.course?.creditUnits || 0} units
                          </Badge>
                        </TableCell>
                        <TableCell>{registration.semester?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              registration.status === 'completed' ? 'default' :
                              registration.status === 'in_progress' ? 'secondary' :
                              registration.status === 'dropped' ? 'destructive' :
                              'outline'
                            }
                          >
                            {registration.status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {registration.grade ? (
                            <Badge variant="outline">{registration.grade}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2" />
              Select Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Select Semester
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Choose semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => (
                  <SelectItem key={semester._id} value={semester._id}>
                    {semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedLevel && selectedSemester && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Available Courses
              </div>
              {selectedCourses.length > 0 && (
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">
                    {selectedCourses.length} course(s) selected
                  </Badge>
                  <Badge variant="outline">
                    {getTotalCreditUnits()} credit units
                  </Badge>
                  <Button 
                    onClick={handleCourseRegistration}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Register Selected Courses'
                    )}
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Select the courses you want to register for this semester
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2 text-muted-foreground">Loading available courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No courses available for the selected level and semester
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Credit Units</TableHead>
                    <TableHead>Semester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={(checked) => 
                            handleCourseSelection(course.id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {course.department?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{course.creditUnits} units</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {course.semesterName || 'Unknown Semester'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}