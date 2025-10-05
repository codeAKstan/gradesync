import bcrypt from 'bcryptjs';

export class Student {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.matricNumber = data.matricNumber;
    this.department = data.department;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Hash password before saving
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Compare password for login
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      matricNumber: this.matricNumber,
      department: this.department,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Convert to safe object (without password) for API responses
  toSafeObject() {
    return {
      _id: this._id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      matricNumber: this.matricNumber,
      department: this.department,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this.email || !this.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!this.firstName || this.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!this.lastName || this.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!this.matricNumber || this.matricNumber.trim().length === 0) {
      errors.push('Matric number is required');
    }

    if (!this.department || this.department.trim().length === 0) {
      errors.push('Department is required');
    }

    // Validate matric number format (basic validation)
    if (this.matricNumber && !/^\d{4}\/\d{6}$/.test(this.matricNumber.trim())) {
      errors.push('Matric number must be in format YYYY/XXXXXX (e.g., 2021/247789)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Static method to validate login credentials
  static validateLoginCredentials(email, password) {
    const errors = [];

    if (!email || !email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!password || password.length === 0) {
      errors.push('Password is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}