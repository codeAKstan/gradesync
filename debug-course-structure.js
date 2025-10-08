const { MongoClient } = require("mongodb");

async function checkCourseStructure() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Get a sample course to see its structure
    const sampleCourse = await db.collection("courses").findOne({});
    console.log("Sample course structure:");
    console.log(JSON.stringify(sampleCourse, null, 2));
    
    // Check if courses have department field
    const coursesWithDept = await db.collection("courses").find({
      $or: [
        { department: { $exists: true } },
        { departmentId: { $exists: true } }
      ]
    }).limit(3).toArray();
    
    console.log("\nCourses with department info:");
    coursesWithDept.forEach(course => {
      console.log(`Course: ${course.title}`);
      console.log(`Department field:`, course.department);
      console.log(`DepartmentId field:`, course.departmentId);
      console.log("---");
    });
    
  } finally {
    await client.close();
  }
}

checkCourseStructure().catch(console.error);