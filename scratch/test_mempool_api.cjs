const axios = require('axios');

async function run() {
  try {
    const res = await axios.get('https://mempool.space/api/mempool/recent');
    console.log("Mempool API response type:", typeof res.data, Array.isArray(res.data) ? "ARRAY" : "NOT ARRAY");
    if (Array.isArray(res.data) && res.data.length > 0) {
      console.log("First item:", JSON.stringify(res.data[0], null, 2));
    }
  } catch (e) {
    console.error("Fetch failed:", e.message);
  }
}

run();
