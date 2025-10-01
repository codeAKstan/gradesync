export class Course {
  constructor(data) {
    this.title = data.title;
    this.code = data.code; // e.g., "CSC101", "ENG201"
    this.description = data.description || '';
    this.creditUnits = data.creditUnits || 0;
    this.level = data.level; // e.g., 100, 200, 300, 400
    this.semester = data.semester; // 1 or 2
    this.departmentId = data.departmentId;
    this.prerequisites = data.prerequisites || []; // Array of course codes
    this.isElective = data.isElective || false;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdBy = data.createdBy; // Admin ID
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Course title is required');
    }

    if (!this.code || this.code.trim().length === 0) {
      errors.push('Course code is required');
    }

    if (this.code && (this.code.length < 3 || this.code.length > 10)) {
      errors.push('Course code must be between 3 and 10 characters');
    }

    if (!this.creditUnits || this.creditUnits < 1 || this.creditUnits > 6) {
      errors.push('Credit units must be between 1 and 6');
    }

    if (!this.level || ![100, 200, 300, 400, 500].includes(this.level)) {
      errors.push('Level must be 100, 200, 300, 400, or 500');
    }

    if (!this.semester || ![1, 2].includes(this.semester)) {
      errors.push('Semester must be 1 or 2');
    }

    if (!this.departmentId) {
      errors.push('Department ID is required');
    }

    if (!this.createdBy) {
      errors.push('Created by admin ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      title: this.title,
      code: this.code.toUpperCase(),
      description: this.description,
      creditUnits: this.creditUnits,
      level: this.level,
      semester: this.semester,
      departmentId: this.departmentId,
      prerequisites: this.prerequisites,
      isElective: this.isElective,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}