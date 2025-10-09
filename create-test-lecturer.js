const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createTestLecturer() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('gradesynce');
    const lecturersCollection = db.collection('lecturers');
    const departmentsCollection = db.collection('departments');
    
    // First, get a department to assign the lecturer to
    const department = await departmentsCollection.findOne({});
    if (!department) {
      console.log('No departments found. Please create a department first.');
      return;
    }
    
    console.log(`Using department: ${department.name} (${department.code})`);
    
    // Test lecturer credentials
    const testEmail = 'test.lecturer@university.edu';
    const testPassword = 'TestPass123';
    
    // Check if test lecturer already exists
    const existingLecturer = await lecturersCollection.findOne({
      email: { $regex: new RegExp(`^${testEmail}$`, 'i') }
    });
    
    if (existingLecturer) {
      console.log('Test lecturer already exists. Updating password...');
      
      // Hash the new password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(testPassword, salt);
      
      // Update the existing lecturer's password
      await lecturersCollection.updateOne(
        { _id: existingLecturer._id },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('Test lecturer password updated successfully!');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
      console.log(`Staff ID: ${existingLecturer.staffId}`);
      
    } else {
      console.log('Creating new test lecturer...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(testPassword, salt);
      
      // Generate staff ID
      const staffId = `${department.code}-TEST-001`;
      
      // Create test lecturer
      const testLecturer = {
        firstName: 'Test',
        lastName: 'Lecturer',
        email: testEmail,
        password: hashedPassword,
        staffId: staffId,
        departmentId: department._id,
        phone: '+1234567890',
        title: 'Dr.',
        qualification: 'PhD Computer Science',
        specialization: 'Software Engineering',
        isActive: true,
        createdBy: new ObjectId(), // Dummy admin ID
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      };
      
      const result = await lecturersCollection.insertOne(testLecturer);
      
      console.log('Test lecturer created successfully!');
      console.log(`ID: ${result.insertedId}`);
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
      console.log(`Staff ID: ${staffId}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createTestLecturer();