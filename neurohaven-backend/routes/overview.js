const express = require("express");
const router = express.Router();

const { getOverviewStatus, getCarePathways } = require("../controllers/overviewController");
const { verifyAuthToken } = require("../middleware/auth");

// Secured Overview Dashboard endpoints
router.get("/status", verifyAuthToken, getOverviewStatus);
router.get("/care-pathways", verifyAuthToken, getCarePathways);

module.exports = router;
