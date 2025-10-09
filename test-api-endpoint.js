// Test the course registration API endpoint directly
async function testRegistrationAPI() {
  try {
    // First, let's test with a mock token to see the response structure
    console.log('Testing course registration API endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/student/course-registration', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // We'll need to get a real token, but let's see what happens without one first
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testRegistrationAPI();