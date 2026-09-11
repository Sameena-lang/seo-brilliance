const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function test() {
  try {
    const user = await prisma.user.findFirst();
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Hit the API
    const res = await axios.get('http://localhost:5000/api/v1/pages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("SUCCESS length:", res.data.data?.pages?.length);
  } catch (error) {
    console.error("API ERROR:", error.response ? error.response.data : error.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
