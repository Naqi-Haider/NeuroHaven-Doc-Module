const express = require("express");
const router = express.Router();

const { getAlerts, resolveAlert, resolveAllAlerts } = require("../controllers/alertController");
const { verifyAuthToken } = require("../middleware/auth");

// Secured Alerts endpoints
router.get("/", verifyAuthToken, getAlerts);
router.put("/:alertId/resolve", verifyAuthToken, resolveAlert);
router.post("/resolve-all", verifyAuthToken, resolveAllAlerts);

module.exports = router;
