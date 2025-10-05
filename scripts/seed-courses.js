import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

async function seedCourses() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('gradesynce');
    const coursesCollection = db.collection('courses');
    const departmentsCollection = db.collection('departments');
    
    // Get Computer Science department ID
    const csDepartment = await departmentsCollection.findOne({ code: 'CSC' });
    if (!csDepartment) {
      console.error('Computer Science department not found');
      return;
    }
    
    console.log('Found CS Department:', csDepartment._id);
    
    // Sample courses for Computer Science
    const sampleCourses = [
      {
        title: 'Introduction to Programming',
        code: 'CSC101',
        description: 'Basic programming concepts using Python',
        creditUnits: 3,
        level: 100,
        semester: 1,
        departmentId: csDepartment._id.toString(),
        prerequisites: [],
        isElective: false,
        isActive: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Data Structures and Algorithms',
        code: 'CSC201',
        description: 'Introduction to data structures and algorithm design',
        creditUnits: 3,
        level: 200,
        semester: 1,
        departmentId: csDepartment._id.toString(),
        prerequisites: ['CSC101'],
        isElective: false,
        isActive: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Database Systems',
        code: 'CSC202',
        description: 'Database design, SQL, and database management systems',
        creditUnits: 3,
        level: 200,
        semester: 2,
        departmentId: csDepartment._id.toString(),
        prerequisites: ['CSC101'],
        isElective: false,
        isActive: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Web Development',
        code: 'CSC301',
        description: 'Modern web development with HTML, CSS, JavaScript, and frameworks',
        creditUnits: 3,
        level: 300,
        semester: 1,
        departmentId: csDepartment._id.toString(),
        prerequisites: ['CSC201'],
        isElective: false,
        isActive: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Mobile App Development',
        code: 'CSC302',
        description: 'Cross-platform mobile application development',
        creditUnits: 3,
        level: 300,
        semester: 2,
        departmentId: csDepartment._id.toString(),
        prerequisites: ['CSC201'],
        isElective: true,
        isActive: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Software Engineering',
        code: 'CSC401',
        description: 'Software development lifecycle, project management, and best practices',
        creditUnits: 4,
        level: 400,
        semester: 1,
        departmentId: csDepartment._id.toString(),
        prerequisites: ['CSC301'],
        isElective: false,
        isActive: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert courses
    const result = await coursesCollection.insertMany(sampleCourses);
    console.log(`Inserted ${result.insertedCount} courses successfully`);
    
    // Display inserted courses
    console.log('Inserted courses:');
    sampleCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.code} - ${course.title} (Level ${course.level}, Semester ${course.semester})`);
    });
    
  } catch (error) {
    console.error('Error seeding courses:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

seedCourses();