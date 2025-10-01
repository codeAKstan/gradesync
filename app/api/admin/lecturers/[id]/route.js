import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Lecturer } from '@/models/Lecturer';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch single lecturer
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
        { success: false, message: 'Invalid lecturer ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const lecturersCollection = db.collection('lecturers');

    // Fetch lecturer with department details
    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          password: 0 // Exclude password from response
        }
      }
    ];

    const result = await lecturersCollection.aggregate(pipeline).toArray();
    const lecturer = result[0];

    if (!lecturer) {
      return NextResponse.json(
        { success: false, message: 'Lecturer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lecturer
    });

  } catch (error) {
    console.error('Error fetching lecturer:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update lecturer
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
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      staffId, 
      departmentId, 
      phone, 
      title, 
      qualification, 
      specialization, 
      isActive 
    } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid lecturer ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const lecturersCollection = db.collection('lecturers');
    const departmentsCollection = db.collection('departments');

    // Check if lecturer exists
    const existingLecturer = await lecturersCollection.findOne({ _id: new ObjectId(id) });
    if (!existingLecturer) {
      return NextResponse.json(
        { success: false, message: 'Lecturer not found' },
        { status: 404 }
      );
    }

    // Verify department exists if being updated
    if (departmentId && departmentId !== existingLecturer.departmentId) {
      if (!ObjectId.isValid(departmentId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid department ID' },
          { status: 400 }
        );
      }

      const department = await departmentsCollection.findOne({ 
        _id: new ObjectId(departmentId) 
      });
      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Department not found' },
          { status: 404 }
        );
      }
    }

    // Check if another lecturer with same email or staff ID exists (excluding current lecturer)
    if (email || staffId) {
      const duplicateQuery = {
        _id: { $ne: new ObjectId(id) },
        $or: []
      };

      if (email && email.toLowerCase() !== existingLecturer.email.toLowerCase()) {
        duplicateQuery.$or.push({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      }

      if (staffId && staffId.toLowerCase() !== existingLecturer.staffId.toLowerCase()) {
        duplicateQuery.$or.push({ staffId: { $regex: new RegExp(`^${staffId}$`, 'i') } });
      }

      if (duplicateQuery.$or.length > 0) {
        const duplicateLecturer = await lecturersCollection.findOne(duplicateQuery);
        if (duplicateLecturer) {
          const duplicateField = duplicateLecturer.email.toLowerCase() === email?.toLowerCase() ? 'email' : 'staff ID';
          return NextResponse.json(
            { 
              success: false, 
              message: `Lecturer with this ${duplicateField} already exists` 
            },
            { status: 409 }
          );
        }
      }
    }

    // Create updated lecturer object
    const updatedLecturer = new Lecturer({
      ...existingLecturer,
      firstName: firstName || existingLecturer.firstName,
      lastName: lastName || existingLecturer.lastName,
      email: email || existingLecturer.email,
      password: password || existingLecturer.password,
      staffId: staffId || existingLecturer.staffId,
      departmentId: departmentId ? new ObjectId(departmentId) : existingLecturer.departmentId,
      phone: phone !== undefined ? phone : existingLecturer.phone,
      title: title !== undefined ? title : existingLecturer.title,
      qualification: qualification !== undefined ? qualification : existingLecturer.qualification,
      specialization: specialization !== undefined ? specialization : existingLecturer.specialization,
      isActive: isActive !== undefined ? isActive : existingLecturer.isActive,
      updatedAt: new Date()
    });

    // Validate updated lecturer data
    const validation = updatedLecturer.validate();
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Hash password if it was updated
    if (password && password !== existingLecturer.password) {
      await updatedLecturer.hashPassword();
    }

    // Update in database
    const result = await lecturersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedLecturer.toObject() }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Lecturer not found' },
        { status: 404 }
      );
    }

    // Return updated lecturer data without password
    const lecturerData = updatedLecturer.getPublicProfile();
    lecturerData.id = id;

    return NextResponse.json({
      success: true,
      message: 'Lecturer updated successfully',
      data: lecturerData
    });

  } catch (error) {
    console.error('Error updating lecturer:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete lecturer
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
        { success: false, message: 'Invalid lecturer ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gradesynce');
    const lecturersCollection = db.collection('lecturers');
    const assignmentsCollection = db.collection('course_assignments');

    // Check if lecturer has associated course assignments
    const associatedAssignments = await assignmentsCollection.countDocuments({ 
      lecturerId: id 
    });

    if (associatedAssignments > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete lecturer with associated course assignments. Please reassign courses first.' 
        },
        { status: 409 }
      );
    }

    // Delete the lecturer
    const result = await lecturersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Lecturer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lecturer deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting lecturer:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}