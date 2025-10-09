const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function debugCourseValidation() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('gradesynce');
    
    // Check courses structure
    const courses = await db.collection('courses').find({}).toArray();
    console.log('\nCourses in database:');
    courses.forEach(course => {
      console.log(`- ID: ${course._id}`);
      console.log(`  Code: ${course.code}`);
      console.log(`  Title: ${course.title}`);
      console.log(`  Level: ${course.level}`);
      console.log(`  Semester: ${course.semester} (type: ${typeof course.semester})`);
      console.log('---');
    });
    
    // Check semesters collection
    const semesters = await db.collection('semesters').find({}).toArray();
    console.log('\nSemesters in database:');
    semesters.forEach(semester => {
      console.log(`- ID: ${semester._id}`);
      console.log(`  Name: ${semester.name}`);
      console.log('---');
    });
    
    // Test course validation with sample data
    const sampleCourseId = courses[0]?._id;
    const sampleLevel = courses[0]?.level;
    const sampleSemester = courses[0]?.semester;
    
    if (sampleCourseId) {
      console.log(`\nTesting course validation:`);
      console.log(`Course ID: ${sampleCourseId}`);
      console.log(`Level: ${sampleLevel}`);
      console.log(`Semester: ${sampleSemester}`);
      
      // Test with string semester
      const validationResult1 = await db.collection('courses').find({
        _id: { $in: [new ObjectId(sampleCourseId)] },
        level: parseInt(sampleLevel),
        semester: sampleSemester
      }).toArray();
      
      console.log(`\nValidation with string semester: ${validationResult1.length} matches`);
      
      // Test with ObjectId semester
      const validationResult2 = await db.collection('courses').find({
        _id: { $in: [new ObjectId(sampleCourseId)] },
        level: parseInt(sampleLevel),
        semester: new ObjectId(sampleSemester)
      }).toArray();
      
      console.log(`Validation with ObjectId semester: ${validationResult2.length} matches`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugCourseValidation();