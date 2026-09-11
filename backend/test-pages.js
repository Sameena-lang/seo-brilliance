const axios = require('axios');

async function test() {
  try {
    // First login to get a token
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'demo@example.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token || loginRes.data.data.token;
    console.log("Logged in");

    // Fetch /pages
    const pagesRes = await axios.get('http://localhost:5000/api/v1/pages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Pages response:", pagesRes.data);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
}
test();
