const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testRegisteredCourses() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('gradesynce');
    const studentId = new ObjectId('68e29013adfeb650758d672f'); // Current student ID
    
    console.log('\n=== Testing Registered Courses Query ===');
    console.log('Student ID:', studentId.toString());
    
    // First, let's see what registrations exist for this student
    const registrations = await db.collection('courseregistrations').find({
      studentId: studentId
    }).toArray();
    
    console.log('\nDirect registrations for student:');
    console.log('Count:', registrations.length);
    registrations.forEach((reg, index) => {
      console.log(`${index + 1}. Course: ${reg.courseId}, Semester: ${reg.semester}, Level: ${reg.level}, Date: ${reg.registrationDate}`);
    });
    
    // Now let's test the aggregation pipeline from the API
    const pipeline = [
      { $match: { studentId: studentId } },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'course.departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'semesters',
          localField: 'semesterId', // This field doesn't exist in our registrations!
          foreignField: '_id',
          as: 'semester'
        }
      },
      {
        $unwind: {
          path: '$semester',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          registrationDate: 1,
          status: 1,
          grade: 1,
          course: {
            _id: '$course._id',
            title: '$course.title',
            code: '$course.code',
            creditUnits: '$course.creditUnits',
            level: '$course.level'
          },
          department: {
            name: '$department.name',
            code: '$department.code'
          },
          semester: {
            name: '$semester.name',
            _id: '$semester._id'
          }
        }
      },
      { $sort: { registrationDate: -1 } }
    ];
    
    console.log('\n=== Testing API Aggregation Pipeline ===');
    const pipelineResult = await db.collection('courseregistrations').aggregate(pipeline).toArray();
    console.log('Pipeline result count:', pipelineResult.length);
    
    if (pipelineResult.length > 0) {
      console.log('Sample result:');
      console.log(JSON.stringify(pipelineResult[0], null, 2));
    }
    
    // Let's also check what semester data looks like
    console.log('\n=== Semester Collection Sample ===');
    const semesters = await db.collection('semesters').find({}).limit(3).toArray();
    semesters.forEach(sem => {
      console.log(`Semester: ${sem.name}, ID: ${sem._id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testRegisteredCourses();