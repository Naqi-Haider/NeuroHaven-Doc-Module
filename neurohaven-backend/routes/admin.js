const express = require("express");
const router = express.Router();
const {
  adminLogin,
  verifyAdminToken,
  getOverviewStats,
  getPatients,
  getDoctors,
  getLinksMap,
  updateUserStatus,
  getFeedbackReviews,
  getDoctorEvaluations,
  getTickets,
  updateTicketStatus,
  createSupportTicket,
  createFeedbackReview,
  createDoctorEvaluation
} = require("../controllers/adminController");

// Public routes/API endpoints for patients and doctors
router.post("/auth/login", adminLogin);
router.post("/support/ticket", createSupportTicket);
router.post("/reports/patient-doctor", createFeedbackReview);
router.post("/reports/doctor-patient", createDoctorEvaluation);

// Admin authenticated routes
router.use(verifyAdminToken);

router.get("/overview-stats", getOverviewStats);
router.get("/patients", getPatients);
router.get("/doctors", getDoctors);
router.get("/links-map", getLinksMap);
router.get("/reports/doctor-patient", getDoctorEvaluations);
router.get("/reports/patient-doctor", getFeedbackReviews);

router.get("/tickets", getTickets);
router.patch("/tickets/:ticketId", updateTicketStatus);
router.patch("/users/:userId/status", updateUserStatus);

module.exports = router;
