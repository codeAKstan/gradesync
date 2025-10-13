export class StudentResult {
  constructor(data) {
    this.studentId = data.studentId;
    this.semester = data.semester; // Store semester name for consistency
    this.academicSessionId = data.academicSessionId || null;
    this.gpa = data.gpa || null;
    this.totalUnits = data.totalUnits || 0;
    this.totalWeightedPoints = data.totalWeightedPoints || 0;
    this.cgpa = data.cgpa || null;
    this.computedAt = data.computedAt || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  validate() {
    const errors = [];
    if (!this.studentId) errors.push('Student ID is required');
    if (!this.semester) errors.push('Semester name is required');
    return { isValid: errors.length === 0, errors };
  }

  toObject() {
    return {
      studentId: this.studentId,
      semester: this.semester,
      academicSessionId: this.academicSessionId,
      gpa: this.gpa,
      totalUnits: this.totalUnits,
      totalWeightedPoints: this.totalWeightedPoints,
      cgpa: this.cgpa,
      computedAt: this.computedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}