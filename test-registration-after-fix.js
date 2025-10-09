const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testRegistrationAfterFix() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('gradesynce');
    
    // Check current registrations count
    const registrationsCount = await db.collection('courseregistrations').countDocuments();
    console.log(`\nCurrent registrations count: ${registrationsCount}`);
    
    // Check all registrations
    const registrations = await db.collection('courseregistrations').find({}).toArray();
    console.log('\nAll registrations:');
    registrations.forEach((reg, index) => {
      console.log(`${index + 1}. Student: ${reg.studentId}, Course: ${reg.courseId}, Status: ${reg.status}, Date: ${reg.registrationDate}`);
    });
    
    // Check if the current student has any registrations
    const currentStudentId = new ObjectId('68e29013adfeb650758d672f');
    const currentStudentRegs = await db.collection('courseregistrations').find({
      studentId: currentStudentId
    }).toArray();
    
    console.log(`\nRegistrations for current student (${currentStudentId}):`);
    if (currentStudentRegs.length === 0) {
      console.log('No registrations found for current student');
    } else {
      currentStudentRegs.forEach((reg, index) => {
        console.log(`${index + 1}. Course: ${reg.courseId}, Status: ${reg.status}, Date: ${reg.registrationDate}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testRegistrationAfterFix();