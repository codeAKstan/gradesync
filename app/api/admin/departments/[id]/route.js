import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Department } from '@/models/Department';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch single department
export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const departmentsCollection = db.collection('departments');

    const department = await departmentsCollection.findOne({ _id: new ObjectId(id) });

    if (!department) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department
    });

  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update department
export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, code, description, hodEmail, hodName, isActive } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const departmentsCollection = db.collection('departments');

    // Check if department exists
    const existingDepartment = await departmentsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingDepartment) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if another department with same name or code exists (excluding current department)
    if (name || code) {
      const duplicateQuery = {
        _id: { $ne: new ObjectId(id) },
        $or: []
      };

      if (name && name.toLowerCase() !== existingDepartment.name.toLowerCase()) {
        duplicateQuery.$or.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      }

      if (code && code.toLowerCase() !== existingDepartment.code.toLowerCase()) {
        duplicateQuery.$or.push({ code: { $regex: new RegExp(`^${code}$`, 'i') } });
      }

      if (duplicateQuery.$or.length > 0) {
        const duplicateDepartment = await departmentsCollection.findOne(duplicateQuery);
        if (duplicateDepartment) {
          const duplicateField = duplicateDepartment.name.toLowerCase() === name?.toLowerCase() ? 'name' : 'code';
          return NextResponse.json(
            { 
              success: false, 
              message: `Department with this ${duplicateField} already exists` 
            },
            { status: 409 }
          );
        }
      }
    }

    // Create updated department object
    const updatedDepartment = new Department({
      ...existingDepartment,
      name: name || existingDepartment.name,
      code: code || existingDepartment.code,
      description: description !== undefined ? description : existingDepartment.description,
      hodEmail: hodEmail !== undefined ? hodEmail : existingDepartment.hodEmail,
      hodName: hodName !== undefined ? hodName : existingDepartment.hodName,
      isActive: isActive !== undefined ? isActive : existingDepartment.isActive,
      updatedAt: new Date()
    });

    // Validate updated department data
    const validation = updatedDepartment.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Update in database
    const result = await departmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedDepartment.toObject() }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Department updated successfully',
      data: { id, ...updatedDepartment.toObject() }
    });

  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete department
export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const departmentsCollection = db.collection('departments');
    const lecturersCollection = db.collection('lecturers');
    const coursesCollection = db.collection('courses');

    // Check if department has associated lecturers
    const associatedLecturers = await lecturersCollection.countDocuments({ 
      departmentId: id 
    });

    if (associatedLecturers > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete department with associated lecturers. Please reassign or remove lecturers first.' 
        },
        { status: 409 }
      );
    }

    // Check if department has associated courses
    const associatedCourses = await coursesCollection.countDocuments({ 
      departmentId: id 
    });

    if (associatedCourses > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete department with associated courses. Please reassign or remove courses first.' 
        },
        { status: 409 }
      );
    }

    // Delete the department
    const result = await departmentsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}