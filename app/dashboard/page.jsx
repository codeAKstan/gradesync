"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  GraduationCap, 
  User, 
  Mail, 
  IdCard, 
  Building2, 
  LogOut,
  BookOpen,
  Calendar,
  Clock
} from "lucide-react"

export default function StudentDashboard() {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [coursesCount, setCoursesCount] = useState(0)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [gpa, setGpa] = useState(null)
  const [cgpa, setCgpa] = useState(null)
  const [gpaLoading, setGpaLoading] = useState(true)
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
    setLoading(false)
    
    // Fetch courses count
    fetchCoursesCount()
    
    // Fetch recent activities
    fetchRecentActivities()

    // Fetch latest GPA/CGPA summary
    fetchLatestGPA()
  }, [router])

  const fetchCoursesCount = async () => {
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
        setCoursesCount(data.data?.length || 0)
      } else {
        console.error('Failed to fetch courses:', data.message)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setCoursesLoading(false)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/student/activities?limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        setActivities(data.data || [])
      } else {
        console.error('Failed to fetch activities:', data.message)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setActivitiesLoading(false)
    }
  }

  const fetchLatestGPA = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/student/results?latest=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const summary = data.data[0]?.summary || {}
        setGpa(typeof summary.gpa === 'number' ? summary.gpa : null)
        setCgpa(typeof summary.cgpa === 'number' ? summary.cgpa : null)
      } else {
        setGpa(null)
        setCgpa(null)
      }
    } catch (error) {
      console.error('Error fetching GPA:', error)
      setGpa(null)
      setCgpa(null)
    } finally {
      setGpaLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load student data</p>
          <Button onClick={() => router.push('/login')} className="mt-4">
            Return to Login
          </Button>
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
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">GradeSync</h1>
                <p className="text-sm text-gray-500">Student Dashboard</p>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {student.firstName}!
          </h2>
          <p className="text-gray-600">
            Here's your academic overview and recent activities.
          </p>
        </div>

        {/* Student Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Student Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{student.email}</p>
                  <p className="text-xs text-gray-500">Email Address</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <IdCard className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{student.matricNumber}</p>
                  <p className="text-xs text-gray-500">Matric Number</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Building2 className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{student.department}</p>
                  <p className="text-xs text-gray-500">Department</p>
                </div>
              </div>
              <div className="pt-2">
                <Badge variant="secondary" className="text-xs">
                  Active Student
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-lg">Courses</span>
                  </div>
                  <Badge variant="outline">
                    {coursesLoading ? '...' : coursesCount}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {coursesLoading 
                    ? 'Loading courses...' 
                    : coursesCount === 0 
                      ? 'No courses enrolled yet' 
                      : `${coursesCount} course${coursesCount !== 1 ? 's' : ''} enrolled`
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-lg">Assignments</span>
                  </div>
                  <Badge variant="outline">0</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  No pending assignments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="text-lg">GPA</span>
                  </div>
                  <Badge variant="outline">
                    {gpaLoading ? '...' : (gpa !== null ? Number(gpa).toFixed(2) : 'N/A')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gpaLoading ? (
                  <p className="text-sm text-gray-600">Loading GPA...</p>
                ) : gpa === null ? (
                  <p className="text-sm text-gray-600">No grades available yet</p>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p>Latest semester GPA</p>
                    {cgpa !== null && (
                      <p className="text-xs text-gray-500 mt-1">CGPA: {Number(cgpa).toFixed(2)}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                    <span className="text-lg">Semester</span>
                  </div>
                  <Badge variant="outline">Current</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Academic session active
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Course Registration</span>
              </CardTitle>
              <CardDescription>
                Register for courses and manage your academic schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => router.push('/student/course-registration')}
              >
                Register for Courses
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-green-600" />
                <span>View Results</span>
              </CardTitle>
              <CardDescription>
                Check your grades and academic performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => router.push('/student/results')}
              >
                View Results
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-600" />
                <span>Profile</span>
              </CardTitle>
              <CardDescription>
                Update your personal information and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                className="w-full"
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest academic activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-500">Loading activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No recent activity</p>
                <p className="text-sm text-gray-400">
                  Your academic activities will appear here once you start engaging with courses and assignments.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity._id || index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      {activity.activityType === 'course_registration' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      {activity.activityType === 'course_drop' && (
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                      {activity.activityType === 'login' && (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      {activity.activityType === 'profile_update' && (
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      {!['course_registration', 'course_drop', 'login', 'profile_update'].includes(activity.activityType) && (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}