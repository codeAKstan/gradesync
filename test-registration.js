const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testRegistration() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('gradesynce');
    
    // Check available courses
    const courses = await db.collection('courses').find({}).toArray();
    console.log('\nAvailable courses:');
    courses.forEach(course => {
      console.log(`- ${course.code}: ${course.title} (Level: ${course.level}, Semester: ${course.semester})`);
    });
    
    // Check current student
    const students = await db.collection('students').find({}).toArray();
    console.log('\nStudents:');
    students.forEach(student => {
      console.log(`- ${student._id}: ${student.email} (Level: ${student.level})`);
    });
    
    // Check existing registrations
    const registrations = await db.collection('courseregistrations').find({}).toArray();
    console.log('\nExisting registrations:');
    registrations.forEach(reg => {
      console.log(`- Student: ${reg.studentId}, Course: ${reg.courseId}, Status: ${reg.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testRegistration();