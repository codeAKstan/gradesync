export class StudentActivity {
  constructor(data) {
    this.studentId = data.studentId;
    this.activityType = data.activityType; // 'course_registration', 'course_drop', 'grade_view', 'profile_update', etc.
    this.title = data.title;
    this.description = data.description;
    this.metadata = data.metadata || {}; // Additional data specific to activity type
    this.timestamp = data.timestamp || new Date();
    this.isRead = data.isRead !== undefined ? data.isRead : false;
    this.createdAt = data.createdAt || new Date();
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this.studentId) {
      errors.push('Student ID is required');
    }

    if (!this.activityType) {
      errors.push('Activity type is required');
    }

    if (!this.title) {
      errors.push('Activity title is required');
    }

    if (!this.description) {
      errors.push('Activity description is required');
    }

    // Validate activity type
    const validActivityTypes = [
      'course_registration',
      'course_drop',
      'grade_view',
      'profile_update',
      'login',
      'password_change'
    ];

    if (this.activityType && !validActivityTypes.includes(this.activityType)) {
      errors.push('Invalid activity type');
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
      activityType: this.activityType,
      title: this.title,
      description: this.description,
      metadata: this.metadata,
      timestamp: this.timestamp,
      isRead: this.isRead,
      createdAt: this.createdAt
    };
  }

  // Static method to create activity for course registration
  static createCourseRegistrationActivity(studentId, courseData) {
    return new StudentActivity({
      studentId,
      activityType: 'course_registration',
      title: 'Course Registration',
      description: `Registered for ${courseData.courseCode} - ${courseData.courseName}`,
      metadata: {
        courseId: courseData.courseId,
        courseCode: courseData.courseCode,
        courseName: courseData.courseName,
        semester: courseData.semester
      }
    });
  }

  // Static method to create activity for course drop
  static createCourseDropActivity(studentId, courseData) {
    return new StudentActivity({
      studentId,
      activityType: 'course_drop',
      title: 'Course Dropped',
      description: `Dropped ${courseData.courseCode} - ${courseData.courseName}`,
      metadata: {
        courseId: courseData.courseId,
        courseCode: courseData.courseCode,
        courseName: courseData.courseName,
        semester: courseData.semester
      }
    });
  }

  // Static method to create activity for login
  static createLoginActivity(studentId) {
    return new StudentActivity({
      studentId,
      activityType: 'login',
      title: 'Account Login',
      description: 'Logged into GradeSync dashboard',
      metadata: {
        loginTime: new Date()
      }
    });
  }

  // Static method to create activity for profile update
  static createProfileUpdateActivity(studentId, updatedFields) {
    return new StudentActivity({
      studentId,
      activityType: 'profile_update',
      title: 'Profile Updated',
      description: `Updated profile information: ${updatedFields.join(', ')}`,
      metadata: {
        updatedFields
      }
    });
  }
}