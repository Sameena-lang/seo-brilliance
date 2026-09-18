const axios = require('axios');

async function main() {
  try {
    const res = await axios.get('https://seo-brilliance-api.onrender.com/api/v1/issues');
    console.log("API returned:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log("API error:", err.message, err.response?.data);
  }
}

main();
