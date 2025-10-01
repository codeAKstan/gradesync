'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    headOfDepartment: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Fix: The API returns data.data, not data.departments
        setDepartments(data.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch departments",
          variant: "destructive"
        });
        setDepartments([]); // Ensure departments is always an array
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "An error occurred while fetching departments",
        variant: "destructive"
      });
      setDepartments([]); // Ensure departments is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingDepartment 
        ? `/api/admin/departments/${editingDepartment._id}`
        : '/api/admin/departments';
      
      const method = editingDepartment ? 'PUT' : 'POST';

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
          description: `Department ${editingDepartment ? 'updated' : 'created'} successfully`
        });
        
        setFormData({
          name: '',
          code: '',
          description: '',
          headOfDepartment: ''
        });
        
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingDepartment(null);
        fetchDepartments();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to save department",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the department",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      headOfDepartment: department.headOfDepartment || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (departmentId) => {
    if (!confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/departments/${departmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Department deleted successfully"
        });
        fetchDepartments();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete department",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the department",
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
          <h1 className="text-2xl font-bold">Departments Management</h1>
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
          <h1 className="text-2xl font-bold">Departments Management</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Add a new department to the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="code">Department Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., CSC"
                  required
                />
              </div>

              <div>
                <Label htmlFor="headOfDepartment">Head of Department</Label>
                <Input
                  id="headOfDepartment"
                  value={formData.headOfDepartment}
                  onChange={(e) => setFormData({...formData, headOfDepartment: e.target.value})}
                  placeholder="e.g., Dr. John Smith"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Optional description for this department"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Department</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
          <CardDescription>
            Manage departments in your institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departments && departments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No departments found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Head of Department</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments && departments.map((department) => (
                  <TableRow key={department._id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>
                      <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                        {department.code}
                      </span>
                    </TableCell>
                    <TableCell>{department.headOfDepartment || "Not assigned"}</TableCell>
                    <TableCell>{department.description || "No description"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(department)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(department._id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the department information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Computer Science"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-code">Department Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                placeholder="e.g., CSC"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-headOfDepartment">Head of Department</Label>
              <Input
                id="edit-headOfDepartment"
                value={formData.headOfDepartment}
                onChange={(e) => setFormData({...formData, headOfDepartment: e.target.value})}
                placeholder="e.g., Dr. John Smith"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Optional description for this department"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Department</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}