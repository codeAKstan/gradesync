'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Settings, 
  LogOut,
  User,
  Mail,
  Phone,
  GraduationCap
} from 'lucide-react';

export default function LecturerDashboard() {
  const [lecturer, setLecturer] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if lecturer is logged in
    const token = localStorage.getItem('lecturerToken');
    const lecturerData = localStorage.getItem('lecturerData');
    
    if (!token || !lecturerData) {
      router.push('/lecturer/login');
      return;
    }

    try {
      const parsedLecturer = JSON.parse(lecturerData);
      setLecturer(parsedLecturer);
    } catch (error) {
      console.error('Error parsing lecturer data:', error);
      router.push('/lecturer/login');
      return;
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('lecturerToken');
    localStorage.removeItem('lecturerData');
    router.push('/lecturer/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!lecturer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">GradeSync</h1>
              <span className="ml-4 text-gray-600">Lecturer Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {lecturer.title} {lecturer.firstName} {lecturer.lastName}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {lecturer.title} {lecturer.firstName}!
          </h2>
          <p className="text-gray-600">
            Manage your courses, students, and academic activities from your dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-lg">
                  {lecturer.title} {lecturer.firstName} {lecturer.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Staff ID</p>
                <p className="text-lg font-mono">{lecturer.staffId}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{lecturer.email}</span>
              </div>
              {lecturer.department && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Department</p>
                  <Badge variant="secondary" className="mt-1">
                    {lecturer.department.name}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access your most common tasks and features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push('/lecturer/my-courses')}
                >
                  <BookOpen className="h-6 w-6" />
                  <span className="text-xs">My Courses</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push('/lecturer/students')}
                >
                  <Users className="h-6 w-6" />
                  <span className="text-xs">Students</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  disabled
                >
                  <GraduationCap className="h-6 w-6" />
                  <span className="text-xs">Grades</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  disabled
                >
                  <Calendar className="h-6 w-6" />
                  <span className="text-xs">Schedule</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest academic activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Your academic activities will appear here once you start engaging with courses and students.</p>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
       
      </div>
    </div>
  );
}