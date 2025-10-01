import bcrypt from 'bcryptjs';

export class Lecturer {
  constructor(data) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.password = data.password;
    this.staffId = data.staffId; // Unique staff identifier
    this.departmentId = data.departmentId;
    this.phone = data.phone || '';
    this.title = data.title || ''; // Dr., Prof., Mr., Mrs., etc.
    this.qualification = data.qualification || '';
    this.specialization = data.specialization || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdBy = data.createdBy; // Admin ID
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastLogin = data.lastLogin || null;
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

  // Validation method
  validate() {
    const errors = [];

    if (!this.firstName || this.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!this.lastName || this.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!this.email || !this.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!this.staffId || this.staffId.trim().length === 0) {
      errors.push('Staff ID is required');
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
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      staffId: this.staffId,
      departmentId: this.departmentId,
      phone: this.phone,
      title: this.title,
      qualification: this.qualification,
      specialization: this.specialization,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin
    };
  }

  // Get public profile (without sensitive data)
  getPublicProfile() {
    return {
      id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      staffId: this.staffId,
      departmentId: this.departmentId,
      phone: this.phone,
      title: this.title,
      qualification: this.qualification,
      specialization: this.specialization,
      isActive: this.isActive
    };
  }
}