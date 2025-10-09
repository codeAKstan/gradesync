const { MongoClient } = require('mongodb');

async function checkLecturers() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('gradesynce');
    const lecturers = await db.collection('lecturers').find({}).limit(5).toArray();
    
    console.log(`Found ${lecturers.length} lecturers:`);
    
    lecturers.forEach((lecturer, index) => {
      console.log(`${index + 1}. ${lecturer.firstName} ${lecturer.lastName}`);
      console.log(`   Email: ${lecturer.email}`);
      console.log(`   Staff ID: ${lecturer.staffId}`);
      console.log(`   Active: ${lecturer.isActive}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkLecturers();