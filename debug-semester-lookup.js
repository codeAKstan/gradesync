const { MongoClient, ObjectId } = require('mongodb');

async function debugSemesterLookup() {
  try {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('gradesynce');
    
    console.log('=== DEBUGGING SEMESTER LOOKUP ===\n');
    
    // 1. Check actual registration data structure
    console.log('1. Sample registration record:');
    const registration = await db.collection('courseregistrations').findOne({});
    console.log(JSON.stringify(registration, null, 2));
    
    // 2. Check semester collection structure
    console.log('\n2. Sample semester record:');
    const semester = await db.collection('semesters').findOne({});
    console.log(JSON.stringify(semester, null, 2));
    
    // 3. Check all semesters
    console.log('\n3. All semesters:');
    const allSemesters = await db.collection('semesters').find({}).toArray();
    allSemesters.forEach(sem => {
      console.log(`- ID: ${sem._id}, Name: "${sem.name}"`);
    });
    
    // 4. Test the lookup manually
    console.log('\n4. Testing manual lookup:');
    if (registration) {
      console.log(`Registration semester field: "${registration.semester}"`);
      
      const matchingSemester = await db.collection('semesters').findOne({
        name: registration.semester
      });
      
      if (matchingSemester) {
        console.log('✅ Found matching semester:', matchingSemester.name);
      } else {
        console.log('❌ No matching semester found');
        console.log('Available semester names:', allSemesters.map(s => `"${s.name}"`));
      }
    }
    
    // 5. Test the aggregation pipeline
    console.log('\n5. Testing aggregation pipeline:');
    const pipeline = [
      { $limit: 1 },
      {
        $lookup: {
          from: 'semesters',
          localField: 'semester',
          foreignField: 'name',
          as: 'semesterInfo'
        }
      },
      {
        $project: {
          semester: 1,
          semesterInfo: 1,
          semesterName: '$semesterInfo.name'
        }
      }
    ];
    
    const result = await db.collection('courseregistrations').aggregate(pipeline).toArray();
    console.log('Aggregation result:', JSON.stringify(result, null, 2));
    
    await client.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugSemesterLookup();