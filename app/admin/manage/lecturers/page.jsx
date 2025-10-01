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
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function LecturersPage() {
  const router = useRouter();
  const [lecturers, setLecturers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    phoneNumber: '',
    title: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch lecturers and departments
      const [lecturersResponse, departmentsResponse] = await Promise.all([
        fetch('/api/admin/lecturers', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (lecturersResponse.ok && departmentsResponse.ok) {
        const lecturersData = await lecturersResponse.json();
        const departmentsData = await departmentsResponse.json();
        
        setLecturers(lecturersData.data || []);
        setDepartments(departmentsData.data || []);
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
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.departmentId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingLecturer 
        ? `/api/admin/lecturers/${editingLecturer._id}`
        : '/api/admin/lecturers';
      
      const method = editingLecturer ? 'PUT' : 'POST';

      // Don't send password if editing and password is empty
      const submitData = { ...formData };
      if (editingLecturer && !formData.password) {
        delete submitData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const responseData = await response.json();
        toast({
          title: "Success",
          description: editingLecturer 
            ? "Lecturer updated successfully" 
            : `Lecturer created successfully. Temporary password sent to ${formData.email}`
        });
        
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          departmentId: '',
          phoneNumber: '',
          title: ''
        });
        
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingLecturer(null);
        fetchData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to save lecturer",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the lecturer",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (lecturer) => {
    setEditingLecturer(lecturer);
    setFormData({
      firstName: lecturer.firstName,
      lastName: lecturer.lastName,
      email: lecturer.email,
      departmentId: lecturer.department._id,
      phoneNumber: lecturer.phoneNumber || '',
      title: lecturer.title || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (lecturerId) => {
    if (!confirm('Are you sure you want to delete this lecturer?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/lecturers/${lecturerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Lecturer deleted successfully"
        });
        fetchData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete lecturer",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the lecturer",
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
          <h1 className="text-2xl font-bold">Lecturers Management</h1>
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
          <h1 className="text-2xl font-bold">Lecturers Management</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lecturer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lecturer</DialogTitle>
              <DialogDescription>
                Add a new lecturer to the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Dr., Prof., Mr., Mrs."
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john.doe@university.edu"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="+1234567890"
                />
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
                    {departments.map((department) => (
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
                <Button type="submit">Create Lecturer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lecturers</CardTitle>
          <CardDescription>
            Manage lecturer accounts in your institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lecturers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No lecturers found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lecturers.map((lecturer) => (
                  <TableRow key={lecturer._id}>
                    <TableCell className="font-medium">
                      {lecturer.title && `${lecturer.title} `}
                      {lecturer.firstName} {lecturer.lastName}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                        {lecturer.staffId}
                      </span>
                    </TableCell>
                    <TableCell>{lecturer.email}</TableCell>
                    <TableCell>
                      {lecturer.department?.name} ({lecturer.department?.code})
                    </TableCell>
                    <TableCell>{lecturer.phoneNumber || "Not provided"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(lecturer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lecturer._id)}
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
            <DialogTitle>Edit Lecturer</DialogTitle>
            <DialogDescription>
              Update the lecturer information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Dr., Prof., Mr., Mrs."
                />
              </div>
              <div>
                <Label htmlFor="edit-staffId">Staff ID *</Label>
                <Input
                  id="edit-staffId"
                  value={formData.staffId}
                  onChange={(e) => setFormData({...formData, staffId: e.target.value})}
                  placeholder="STAFF001"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john.doe@university.edu"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-phoneNumber">Phone Number</Label>
              <Input
                id="edit-phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                placeholder="+1234567890"
              />
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
                  {departments.map((department) => (
                    <SelectItem key={department._id} value={department._id}>
                      {department.name} ({department.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Lecturer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}