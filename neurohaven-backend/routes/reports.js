const express = require("express");
const router = express.Router();

const { getReports, generateReport } = require("../controllers/reportController");
const { verifyAuthToken } = require("../middleware/auth");

// Secured Reports endpoints
router.get("/", verifyAuthToken, getReports);
router.post("/generate", verifyAuthToken, generateReport);

module.exports = router;
