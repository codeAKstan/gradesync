"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Shield, Users, BookOpen, BarChart3, Settings, LogOut } from "lucide-react"

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if admin is authenticated
    const token = localStorage.getItem('adminToken')
    const storedAdminData = localStorage.getItem('adminData')
    
    if (!token || !storedAdminData) {
      router.push('/admin/login')
      return
    }

    try {
      setAdminData(JSON.parse(storedAdminData))
    } catch (error) {
      console.error('Error parsing admin data:', error)
      router.push('/admin/login')
      return
    }
    
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">GradeSync</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Welcome, {adminData?.firstName} {adminData?.lastName}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your GradeSync system from this central dashboard.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No students registered yet
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No courses created yet
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grade Reports</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No reports generated yet
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Admin Management */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Management
              </CardTitle>
              <CardDescription>
                Create and manage admin accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/manage/admins">
                <Button className="w-full">
                  Manage Admins
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Academic Sessions */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Academic Sessions
              </CardTitle>
              <CardDescription>
                Create and manage academic sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/manage/academic-sessions">
                <Button className="w-full">
                  Manage Sessions
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Semesters */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Semesters
              </CardTitle>
              <CardDescription>
                Create and manage semesters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/manage/semesters">
                <Button className="w-full">
                  Manage Semesters
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Departments */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Departments
              </CardTitle>
              <CardDescription>
                Create and manage departments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/manage/departments">
                <Button className="w-full">
                  Manage Departments
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Lecturers */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Lecturers
              </CardTitle>
              <CardDescription>
                Create and manage lecturer accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/manage/lecturers">
                <Button className="w-full">
                  Manage Lecturers
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Courses */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Courses
              </CardTitle>
              <CardDescription>
                Create and manage course records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/manage/courses">
                <Button className="w-full">
                  Manage Courses
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Course Assignments */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Course Assignments
              </CardTitle>
              <CardDescription>
                Assign courses to lecturers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/manage/course-assignments">
                <Button className="w-full">
                  Manage Assignments
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* System Reports */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Results  Approval
              </CardTitle>
              <CardDescription>
                View and approve results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/manage/results">
                <Button className="w-full">
                  View Results
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                System Settings (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Info */}
        <Card className="mt-8 border-border">
          <CardHeader>
            <CardTitle>Admin Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-foreground">{adminData?.firstName} {adminData?.lastName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-foreground">{adminData?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function Label({ children, className }) {
  return <label className={className}>{children}</label>
}