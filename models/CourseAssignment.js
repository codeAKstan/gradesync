export class CourseAssignment {
  constructor(data) {
    this.courseId = data.courseId;
    this.lecturerId = data.lecturerId;
    this.academicSessionId = data.academicSessionId;
    this.semesterId = data.semesterId;
    this.assignmentType = data.assignmentType || 'primary'; // primary, secondary, assistant
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.assignedBy = data.assignedBy; // Admin ID
    this.assignedAt = data.assignedAt || new Date();
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this.courseId) {
      errors.push('Course ID is required');
    }

    if (!this.lecturerId) {
      errors.push('Lecturer ID is required');
    }

    if (!this.academicSessionId) {
      errors.push('Academic session ID is required');
    }

    if (!this.semesterId) {
      errors.push('Semester ID is required');
    }

    if (!['primary', 'secondary', 'assistant'].includes(this.assignmentType)) {
      errors.push('Assignment type must be primary, secondary, or assistant');
    }

    if (!this.assignedBy) {
      errors.push('Assigned by admin ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      courseId: this.courseId,
      lecturerId: this.lecturerId,
      academicSessionId: this.academicSessionId,
      semesterId: this.semesterId,
      assignmentType: this.assignmentType,
      isActive: this.isActive,
      assignedBy: this.assignedBy,
      assignedAt: this.assignedAt,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}