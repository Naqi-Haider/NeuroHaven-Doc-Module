const express = require("express");
const multer = require("multer");
const router = express.Router();
const os = require("os");
const path = require("path");

const { getChatMessages, clearChatMessages, sendMessage } = require("../controllers/chatController");
const { uploadAudio, uploadImage, uploadDocument } = require("../controllers/uploadController");
const { verifyAuthToken } = require("../middleware/auth");

// Multer config — store in OS temp dir, 25 MB limit
const upload = multer({
  dest: path.join(os.tmpdir(), "neurohaven-uploads"),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

// Voice note upload — no auth required (patient app doesn't send token for uploads)
router.post("/audio", upload.single("audio"), uploadAudio);

// Image upload — same
router.post("/upload", upload.single("file"), uploadImage);

// Document upload (PDF, DOC, TXT, etc.)
router.post("/document", upload.single("file"), uploadDocument);

// Secured chat history & management
router.get("/messages", getChatMessages);
router.get("/:patientId/messages", verifyAuthToken, getChatMessages);
router.post("/messages", sendMessage);
router.post("/:patientId/messages", sendMessage);
router.delete("/messages", clearChatMessages);
router.delete("/:patientId/messages", clearChatMessages);

module.exports = router;
