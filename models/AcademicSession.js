export class AcademicSession {
  constructor(data) {
    this.name = data.name; // e.g., "2023/2024"
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
      errors.push('Session name is required');
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