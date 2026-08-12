const { supabase, isMock } = require("../config/supabase");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Ensure multer temp directory exists on startup
const tempUploadDir = path.join(os.tmpdir(), "neurohaven-uploads");
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

/**
 * Upload a voice note audio file to Supabase Storage bucket: voice-notes
 * POST /api/chats/audio
 * multipart/form-data: field = "audio", field = "patientId"
 */
const uploadAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No audio file uploaded." });
    }

    const patientId = req.body.patientId || "unknown";
    const ext = path.extname(req.file.originalname) || ".webm";
    const storagePath = `chats/${patientId}/${Date.now()}${ext}`;

    let publicUrl = null;

    if (!isMock) {
      const fileBuffer = fs.readFileSync(req.file.path);

      const { error: uploadError } = await supabase.storage
        .from("voice-notes")
        .upload(storagePath, fileBuffer, {
          contentType: req.file.mimetype || "audio/webm",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase audio upload error:", uploadError.message);
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.status(500).json({ success: false, message: "Audio upload to storage failed.", error: uploadError.message });
      }

      const { data: urlData } = supabase.storage
        .from("voice-notes")
        .getPublicUrl(storagePath);

      publicUrl = urlData?.publicUrl || null;
    } else {
      publicUrl = `https://mock-storage.neurohaven.io/${storagePath}`;
    }

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    console.log(`🎙️ Audio uploaded: ${publicUrl}`);
    return res.status(200).json({ success: true, url: publicUrl });
  } catch (err) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(err);
  }
};

/**
 * Upload an image file to Supabase Storage bucket: chat-media
 * POST /api/chats/upload
 * multipart/form-data: field = "file", field = "patientId"
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file uploaded." });
    }

    // Enforce 3 MB maximum size limit
    const MAX_SIZE_BYTES = 3 * 1024 * 1024;
    if (req.file.size > MAX_SIZE_BYTES) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ success: false, message: "Image file size exceeds maximum limit of 3 MB." });
    }

    const patientId = req.body.patientId || "unknown";
    const ext = path.extname(req.file.originalname) || ".jpg";
    const storagePath = `chats/${patientId}/${Date.now()}${ext}`;

    let publicUrl = null;

    if (!isMock) {
      const fileBuffer = fs.readFileSync(req.file.path);

      let targetBucket = "chat-media";
      let { error: uploadError } = await supabase.storage
        .from("chat-media")
        .upload(storagePath, fileBuffer, {
          contentType: req.file.mimetype || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.warn("chat-media bucket upload warning, attempting voice-notes bucket fallback:", uploadError.message);
        const { error: fbErr } = await supabase.storage
          .from("voice-notes")
          .upload(storagePath, fileBuffer, {
            contentType: req.file.mimetype || "image/jpeg",
            upsert: false,
          });

        if (!fbErr) {
          targetBucket = "voice-notes";
          uploadError = null;
        }
      }

      if (uploadError) {
        console.error("Supabase image upload error:", uploadError.message);
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.status(500).json({ success: false, message: "Image upload to storage failed.", error: uploadError.message });
      }

      const { data: urlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(storagePath);

      publicUrl = urlData?.publicUrl || null;
    } else {
      publicUrl = `https://mock-storage.neurohaven.io/${storagePath}`;
    }

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    console.log(`🖼️ Image uploaded: ${publicUrl}`);
    return res.status(200).json({ success: true, url: publicUrl });
  } catch (err) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(err);
  }
};

/**
 * Upload a document file (PDF, DOC, TXT, etc.) to Supabase Storage bucket: chat-documents
 * POST /api/chats/document
 * multipart/form-data: field = "file", field = "patientId", field = "fileName"
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No document file uploaded." });
    }

    const patientId = req.body.patientId || "unknown";
    const originalName = req.body.fileName || req.file.originalname || "document";
    const ext = path.extname(originalName) || ".pdf";
    const storagePath = `chats/${patientId}/${Date.now()}-${path.basename(originalName, ext)}${ext}`;

    let publicUrl = null;

    if (!isMock) {
      const fileBuffer = fs.readFileSync(req.file.path);

      // Try chat-documents bucket first, fall back to voice-notes
      let targetBucket = "chat-documents";
      let { error: uploadError } = await supabase.storage
        .from("chat-documents")
        .upload(storagePath, fileBuffer, {
          contentType: req.file.mimetype || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.warn("chat-documents bucket unavailable, falling back to voice-notes:", uploadError.message);
        const { error: fbErr } = await supabase.storage
          .from("voice-notes")
          .upload(storagePath, fileBuffer, {
            contentType: req.file.mimetype || "application/octet-stream",
            upsert: false,
          });

        if (!fbErr) {
          targetBucket = "voice-notes";
          uploadError = null;
        }
      }

      if (uploadError) {
        console.error("Supabase document upload error:", uploadError.message);
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.status(500).json({ success: false, message: "Document upload to storage failed.", error: uploadError.message });
      }

      const { data: urlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(storagePath);

      publicUrl = urlData?.publicUrl || null;
    } else {
      publicUrl = `https://mock-storage.neurohaven.io/${storagePath}`;
    }

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    console.log(`📄 Document uploaded: ${publicUrl}`);
    return res.status(200).json({ success: true, url: publicUrl, fileName: originalName });
  } catch (err) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(err);
  }
};

module.exports = { uploadAudio, uploadImage, uploadDocument };
