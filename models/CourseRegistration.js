export class CourseRegistration {
  constructor(data) {
    this.studentId = data.studentId;
    this.courseId = data.courseId;
    this.academicSessionId = data.academicSessionId;
    this.semesterId = data.semesterId;
    this.registrationDate = data.registrationDate || new Date();
    this.status = data.status || 'registered'; // registered, dropped, completed
    this.grade = data.grade || null; // Will be set later by lecturers
    this.gradePoint = data.gradePoint || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this.studentId) {
      errors.push('Student ID is required');
    }

    if (!this.courseId) {
      errors.push('Course ID is required');
    }

    if (!this.academicSessionId) {
      errors.push('Academic session ID is required');
    }

    if (!this.semesterId) {
      errors.push('Semester ID is required');
    }

    if (this.status && !['registered', 'dropped', 'completed'].includes(this.status)) {
      errors.push('Status must be registered, dropped, or completed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      studentId: this.studentId,
      courseId: this.courseId,
      academicSessionId: this.academicSessionId,
      semesterId: this.semesterId,
      registrationDate: this.registrationDate,
      status: this.status,
      grade: this.grade,
      gradePoint: this.gradePoint,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Static method to validate course registration eligibility
  static validateRegistrationEligibility(student, course, existingRegistrations) {
    const errors = [];

    // Check if student is from the same department (for non-elective courses)
    if (!course.isElective && student.department !== course.department?.name) {
      errors.push(`This course is only available for ${course.department?.name} students`);
    }

    // Check if student has already registered for this course
    const alreadyRegistered = existingRegistrations.some(reg => 
      reg.courseId.toString() === course.id && reg.status === 'registered'
    );
    
    if (alreadyRegistered) {
      errors.push('You have already registered for this course');
    }

    // Check prerequisites (simplified - assumes course codes are provided)
    if (course.prerequisites && course.prerequisites.length > 0) {
      const completedCourses = existingRegistrations
        .filter(reg => reg.status === 'completed' && reg.grade && reg.grade !== 'F')
        .map(reg => reg.course?.code);
      
      const missingPrerequisites = course.prerequisites.filter(prereq => 
        !completedCourses.includes(prereq)
      );
      
      if (missingPrerequisites.length > 0) {
        errors.push(`Missing prerequisites: ${missingPrerequisites.join(', ')}`);
      }
    }

    return {
      isEligible: errors.length === 0,
      errors
    };
  }
}