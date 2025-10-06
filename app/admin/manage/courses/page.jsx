'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    creditUnits: '',
    level: '',
    semester: '',
    departmentId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch courses, departments, and semesters
      const [coursesResponse, departmentsResponse, semestersResponse] = await Promise.all([
        fetch('/api/admin/courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/semesters', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (coursesResponse.ok && departmentsResponse.ok && semestersResponse.ok) {
        const coursesData = await coursesResponse.json();
        const departmentsData = await departmentsResponse.json();
        const semestersData = await semestersResponse.json();
        
        setCourses(coursesData.data);
        setDepartments(departmentsData.data);
        setSemesters(semestersData.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.code || !formData.creditUnits || !formData.level || !formData.semester || !formData.departmentId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingCourse 
        ? `/api/admin/courses/${editingCourse._id}`
        : '/api/admin/courses';
      
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          creditUnits: parseInt(formData.creditUnits),
          level: parseInt(formData.level)
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Course ${editingCourse ? 'updated' : 'created'} successfully`
        });
        
        setFormData({
          title: '',
          code: '',
          description: '',
          creditUnits: '',
          level: '',
          semester: '',
          departmentId: ''
        });
        
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingCourse(null);
        fetchData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to save course",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the course",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      code: course.code,
      description: course.description,
      creditUnits: course.creditUnits.toString(),
      level: course.level.toString(),
      semester: course.semester.toString(),
      departmentId: course.department._id
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Course deleted successfully"
        });
        fetchData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete course",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the course",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Courses Management</h1>
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
          <h1 className="text-2xl font-bold">Courses Management</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Add a new course to the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Introduction to Computer Science"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="CS101"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Course description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="creditUnits">Credit Units *</Label>
                  <Input
                    id="creditUnits"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.creditUnits}
                    onChange={(e) => setFormData({...formData, creditUnits: e.target.value})}
                    placeholder="3"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="level">Level *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({...formData, level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 Level</SelectItem>
                      <SelectItem value="200">200 Level</SelectItem>
                      <SelectItem value="300">300 Level</SelectItem>
                      <SelectItem value="400">400 Level</SelectItem>
                      <SelectItem value="500">500 Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="semester">Semester *</Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => setFormData({...formData, semester: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters && semesters.map((semester) => (
                        <SelectItem key={semester._id} value={semester._id}>
                          {semester.name} - {semester.academicSession.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({...formData, departmentId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments && departments.map((department) => (
                      <SelectItem key={department._id} value={department._id}>
                        {department.name} ({department.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Course</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription>
            Manage courses in your institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!courses || courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No courses found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Credit Units</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {course.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.department?.name} ({course.department?.code})
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.level} Level</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {course.semesterName || 'Unknown Semester'}
                      </Badge>
                    </TableCell>
                    <TableCell>{course.creditUnits} units</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(course._id)}
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
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update the course information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Course Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Introduction to Computer Science"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-code">Course Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="CS101"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Course description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-creditUnits">Credit Units *</Label>
                <Input
                  id="edit-creditUnits"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.creditUnits}
                  onChange={(e) => setFormData({...formData, creditUnits: e.target.value})}
                  placeholder="3"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-level">Level *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({...formData, level: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                    <SelectItem value="500">500 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-semester">Semester *</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData({...formData, semester: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters && semesters.map((semester) => (
                      <SelectItem key={semester._id} value={semester._id}>
                        {semester.name} - {semester.academicSession.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-department">Department *</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData({...formData, departmentId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments && departments.map((department) => (
                    <SelectItem key={department._id} value={department._id}>
                      {department.name} ({department.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Course</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}