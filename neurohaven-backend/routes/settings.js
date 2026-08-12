const express = require("express");
const router = express.Router();

const { getSettings, updateSettings } = require("../controllers/settingsController");
const { verifyAuthToken } = require("../middleware/auth");

// Secured Settings endpoints
router.get("/", verifyAuthToken, getSettings);
router.put("/", verifyAuthToken, updateSettings);

module.exports = router;
