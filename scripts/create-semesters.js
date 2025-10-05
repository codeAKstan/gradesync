import clientPromise from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function createSemesters() {
  try {
    const client = await clientPromise;
    const db = client.db('gradesynce');
    
    // Create semester documents with the exact ObjectIds that courses are referencing
    const semesters = [
      {
        _id: new ObjectId("68de97d7d1c0e687daacf6ad"), // First Semester
        name: "First Semester",
        code: "SEM1",
        academicSessionId: new ObjectId("68de2656ef9913a1223a5d00"), // Using existing academic session
        startDate: new Date("2024-09-01"),
        endDate: new Date("2025-01-31"),
        isActive: true,
        description: "First semester of the academic year",
        createdBy: new ObjectId("68dd8b6ada8aa8b12ad78eb6"), // Using existing admin
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId("68de9942d1c0e687daacf6ae"), // Second Semester  
        name: "Second Semester",
        code: "SEM2",
        academicSessionId: new ObjectId("68de2656ef9913a1223a5d00"), // Using existing academic session
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-06-30"),
        isActive: true,
        description: "Second semester of the academic year",
        createdBy: new ObjectId("68dd8b6ada8aa8b12ad78eb6"), // Using existing admin
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert semesters
    const result = await db.collection('semesters').insertMany(semesters);
    console.log(`Created ${result.insertedCount} semester documents`);
    
    // Verify the semesters were created
    const createdSemesters = await db.collection('semesters').find({}).toArray();
    console.log('All semesters in database:');
    createdSemesters.forEach(sem => {
      console.log(`- ${sem.name} (${sem._id})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating semesters:', error);
    process.exit(1);
  }
}

createSemesters();