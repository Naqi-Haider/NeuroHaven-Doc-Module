const axios = require("axios");

async function check() {
  try {
    console.log("Logging in as admin...");
    const loginRes = await axios.post("http://localhost:3001/api/admin/auth/login", {
      email: "naqi073@gmail.com",
      password: "admin123" // wait, let's check admin controller credentials
    });

    const token = loginRes.data.token;
    console.log("Admin login success, token received:", token);

    console.log("Hitting links-map...");
    const linksRes = await axios.get("http://localhost:3001/api/admin/links-map", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("links-map response success:", linksRes.data);
  } catch (err) {
    console.error("❌ Request failed:", err.response ? err.response.data : err.message);
  }
}

check();
