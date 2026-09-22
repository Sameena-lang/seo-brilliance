import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/v1';

async function testAI() {
  const start = Date.now();
  
  // Create a dummy user token or just call the API directly if auth is bypassed
  // Wait, I can just use the login from stress-test.ts
  
  const testEmail = `ai.test.${Date.now()}@example.com`;
  const regRes = await axios.post(`${API_BASE}/auth/register`, {
    fullName: 'AI Tester',
    email: testEmail,
    password: 'SecurePassword123!'
  });
  const token = regRes.data.data.token;
  
  const aiStart = Date.now();
  console.log('Sending AI request...');
  try {
    const res = await axios.post(`${API_BASE}/ai/chat`, {
      message: 'Why is my SEO score low?'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`AI Response time: ${Date.now() - aiStart}ms`);
    console.log(`Response: ${res.data.data.answer.substring(0, 100)}...`);
  } catch (err: any) {
    console.error('AI Error:', err.response?.data || err.message);
  }
}

testAI();
