export class Semester {
  constructor(data) {
    this.name = data.name; // e.g., "First Semester", "Second Semester"
    this.code = data.code; // e.g., "SEM1", "SEM2"
    this.academicSessionId = data.academicSessionId;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.isActive = data.isActive || false;
    this.description = data.description || '';
    this.createdBy = data.createdBy; // Admin ID
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Semester name is required');
    }

    if (!this.code || this.code.trim().length === 0) {
      errors.push('Semester code is required');
    }

    if (!this.academicSessionId) {
      errors.push('Academic session ID is required');
    }

    if (!this.startDate) {
      errors.push('Start date is required');
    }

    if (!this.endDate) {
      errors.push('End date is required');
    }

    if (this.startDate && this.endDate && new Date(this.startDate) >= new Date(this.endDate)) {
      errors.push('End date must be after start date');
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
      name: this.name,
      code: this.code,
      academicSessionId: this.academicSessionId,
      startDate: this.startDate,
      endDate: this.endDate,
      isActive: this.isActive,
      description: this.description,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}