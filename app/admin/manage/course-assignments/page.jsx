'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function CourseAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [filters, setFilters] = useState({
    lecturerId: 'all',
    courseId: 'all',
    academicSessionId: 'all',
    semesterId: 'all',
    isActive: 'all'
  });
  const [formData, setFormData] = useState({
    courseId: '',
    lecturerId: '',
    academicSessionId: '',
    semesterId: '',
    assignmentType: 'primary',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [filters]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch all required data
      const [coursesResponse, lecturersResponse, academicSessionsResponse, semestersResponse] = await Promise.all([
        fetch('/api/admin/courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/lecturers', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/academic-sessions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/semesters', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (coursesResponse.ok && lecturersResponse.ok && academicSessionsResponse.ok && semestersResponse.ok) {
        const coursesData = await coursesResponse.json();
        const lecturersData = await lecturersResponse.json();
        const academicSessionsData = await academicSessionsResponse.json();
        const semestersData = await semestersResponse.json();
        
        setCourses(coursesData.data || []);
        setLecturers(lecturersData.data || []);
        setAcademicSessions(academicSessionsData.data || []);
        setSemesters(semestersData.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') queryParams.append(key, value);
      });

      const response = await fetch(`/api/admin/course-assignments?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch assignments",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching assignments",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.courseId || !formData.lecturerId || !formData.academicSessionId || !formData.semesterId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingAssignment 
        ? `/api/admin/course-assignments/${editingAssignment._id}`
        : '/api/admin/course-assignments';
      
      const method = editingAssignment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Course assignment ${editingAssignment ? 'updated' : 'created'} successfully`
        });
        
        setFormData({
          courseId: '',
          lecturerId: '',
          academicSessionId: '',
          semesterId: '',
          isActive: true
        });
        
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingAssignment(null);
        fetchAssignments();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to save course assignment",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the course assignment",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      courseId: assignment.course?._id || '',
      lecturerId: assignment.lecturer?._id || '',
      academicSessionId: assignment.academicSession?._id || '',
      semesterId: assignment.semester?._id || '',
      assignmentType: assignment.assignmentType || 'primary',
      isActive: assignment.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this course assignment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/course-assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Course assignment deleted successfully"
        });
        fetchAssignments();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete course assignment",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the course assignment",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      lecturerId: 'all',
      courseId: 'all',
      academicSessionId: 'all',
      semesterId: 'all',
      isActive: 'all'
    });
  };

  const getAvailableSemesters = (academicSessionId) => {
    if (!semesters || !Array.isArray(semesters)) {
      return [];
    }
    return semesters.filter(semester => 
      !academicSessionId || semester.academicSession?._id === academicSessionId
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Course Assignments Management</h1>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Course Assignments Management</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course Assignment</DialogTitle>
              <DialogDescription>
                Assign a course to a lecturer for a specific academic session and semester.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="course">Course *</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) => setFormData({...formData, courseId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses && courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.code} - {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lecturer">Lecturer *</Label>
                <Select
                  value={formData.lecturerId}
                  onValueChange={(value) => setFormData({...formData, lecturerId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lecturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {lecturers && lecturers.map((lecturer) => (
                      <SelectItem key={lecturer._id} value={lecturer._id}>
                        {lecturer.firstName} {lecturer.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="academicSession">Academic Session *</Label>
                <Select
                  value={formData.academicSessionId}
                  onValueChange={(value) => setFormData({...formData, academicSessionId: value, semesterId: ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic session" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicSessions && academicSessions.map((session) => (
                      <SelectItem key={session._id} value={session._id}>
                        {session.name} ({session.startYear}-{session.endYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  value={formData.semesterId}
                  onValueChange={(value) => setFormData({...formData, semesterId: value})}
                  disabled={!formData.academicSessionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSemesters(formData.academicSessionId).map((semester) => (
                      <SelectItem key={semester._id} value={semester._id}>
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignmentType">Assignment Type *</Label>
                <Select
                  value={formData.assignmentType}
                  onValueChange={(value) => setFormData({...formData, assignmentType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Active Assignment</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Assignment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label>Lecturer</Label>
              <Select
                value={filters.lecturerId}
                onValueChange={(value) => setFilters({...filters, lecturerId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All lecturers" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All lecturers</SelectItem>
                    {lecturers && lecturers.map((lecturer) => (
                      <SelectItem key={lecturer._id} value={lecturer._id}>
                        {lecturer.firstName} {lecturer.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Course</Label>
              <Select
                value={filters.courseId}
                onValueChange={(value) => setFilters({...filters, courseId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses && courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Academic Session</Label>
              <Select
                value={filters.academicSessionId}
                onValueChange={(value) => setFilters({...filters, academicSessionId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sessions" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All sessions</SelectItem>
                    {academicSessions && academicSessions.map((session) => (
                      <SelectItem key={session._id} value={session._id}>
                        {session.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Semester</Label>
              <Select
                value={filters.semesterId}
                onValueChange={(value) => setFilters({...filters, semesterId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All semesters</SelectItem>
                    {semesters && semesters.map((semester) => (
                      <SelectItem key={semester._id} value={semester._id}>
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={filters.isActive}
                onValueChange={(value) => setFilters({...filters, isActive: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Assignments</CardTitle>
          <CardDescription>
            Manage course assignments to lecturers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!assignments || assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No course assignments found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Academic Session</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.course?.title || 'Unknown Course'}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {assignment.course?.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {assignment.lecturer ? (
                            <>
                              {assignment.lecturer.title && `${assignment.lecturer.title} `}
                              {assignment.lecturer.firstName} {assignment.lecturer.lastName}
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">No Lecturer Assigned</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.lecturer?.staffId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.academicSession?.name || 'Unknown Session'}
                      <div className="text-sm text-muted-foreground">
                        {assignment.academicSession ? `${assignment.academicSession.startYear}-${assignment.academicSession.endYear}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.semester?.name || 'Unknown Semester'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.isActive ? "default" : "secondary"}>
                        {assignment.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(assignment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(assignment._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course Assignment</DialogTitle>
            <DialogDescription>
              Update the course assignment information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-course">Course *</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) => setFormData({...formData, courseId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                    {courses && courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.code} - {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-lecturer">Lecturer *</Label>
              <Select
                value={formData.lecturerId}
                onValueChange={(value) => setFormData({...formData, lecturerId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>
                <SelectContent>
                    {lecturers && lecturers.map((lecturer) => (
                      <SelectItem key={lecturer._id} value={lecturer._id}>
                        {lecturer.title && `${lecturer.title} `}
                        {lecturer.firstName} {lecturer.lastName} ({lecturer.staffId})
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-academicSession">Academic Session *</Label>
              <Select
                value={formData.academicSessionId}
                onValueChange={(value) => setFormData({...formData, academicSessionId: value, semesterId: ''})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic session" />
                </SelectTrigger>
                <SelectContent>
                    {academicSessions && academicSessions.map((session) => (
                      <SelectItem key={session._id} value={session._id}>
                        {session.name} ({session.startYear}-{session.endYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-semester">Semester *</Label>
              <Select
                value={formData.semesterId}
                onValueChange={(value) => setFormData({...formData, semesterId: value})}
                disabled={!formData.academicSessionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSemesters(formData.academicSessionId).map((semester) => (
                    <SelectItem key={semester._id} value={semester._id}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-assignmentType">Assignment Type *</Label>
              <Select
                value={formData.assignmentType}
                onValueChange={(value) => setFormData({...formData, assignmentType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="edit-isActive">Active Assignment</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Assignment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}