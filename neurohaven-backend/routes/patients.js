const express = require("express");
const router = express.Router();

const { getPatients, getPatientById, getPatientNotes, linkPatient, unlinkPatient, getPatientLinkInfo, getPatientVaultItems, getOnlineStatus } = require("../controllers/patientController");
const { verifyAuthToken } = require("../middleware/auth");

// Secured Patient Cohort Directory endpoints
router.get("/", verifyAuthToken, getPatients);
router.get("/online-status", verifyAuthToken, getOnlineStatus);
router.get("/vault-items", verifyAuthToken, getPatientVaultItems);
router.post("/link", verifyAuthToken, linkPatient);
router.post("/unlink", verifyAuthToken, unlinkPatient);
router.delete("/unlink", verifyAuthToken, unlinkPatient);

// Dynamic :patientId routes
router.get("/:patientId/link", verifyAuthToken, getPatientLinkInfo);
router.get("/:patientId/notes", verifyAuthToken, getPatientNotes);
router.get("/:patientId/vault-items", verifyAuthToken, getPatientVaultItems);
router.delete("/:patientId/link", verifyAuthToken, unlinkPatient);
router.post("/:patientId/unlink", verifyAuthToken, unlinkPatient);
router.get("/:patientId", verifyAuthToken, getPatientById);

module.exports = router;

