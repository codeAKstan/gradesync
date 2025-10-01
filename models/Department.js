export class Department {
  constructor(data) {
    this.name = data.name; // e.g., "Computer Science"
    this.code = data.code; // e.g., "CSC", "ENG"
    this.description = data.description || '';
    this.hodEmail = data.hodEmail; // Head of Department email
    this.hodName = data.hodName; // Head of Department name
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdBy = data.createdBy; // Admin ID
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Department name is required');
    }

    if (!this.code || this.code.trim().length === 0) {
      errors.push('Department code is required');
    }

    if (this.code && this.code.length > 10) {
      errors.push('Department code must be 10 characters or less');
    }

    if (this.hodEmail && !this.hodEmail.includes('@')) {
      errors.push('Valid HOD email is required');
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
      code: this.code ? this.code.toUpperCase() : '',
      description: this.description,
      hodEmail: this.hodEmail,
      hodName: this.hodName,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}