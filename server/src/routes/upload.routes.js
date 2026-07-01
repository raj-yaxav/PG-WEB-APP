/**
 * routes/upload.routes.js — File Upload Routes
 *
 * POST /api/uploads/image    — Upload image to Cloudinary
 * POST /api/uploads/document — Upload document to Cloudinary
 *
 * Uses multer with memoryStorage (files held in memory buffer, streamed to Cloudinary).
 * Maximum file sizes:
 *   image: 5MB
 *   document: 10MB
 *
 * Future integrations:
 *   - Tenant profile photo upload
 *   - KYC document upload
 *   - Complaint image upload
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadImage, uploadDocument } = require("../controllers/upload.controller");
const { protect } = require("../middleware/auth.middleware");

// Use memory storage — file is held as a buffer and uploaded to Cloudinary
const storage = multer.memoryStorage();

// Image upload config (jpg, jpeg, png, webp — max 5MB)
const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
    }
  },
});

// Document upload config (pdf, doc, docx — max 10MB)
const documentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and Word documents are allowed"), false);
    }
  },
});

// Routes
router.post("/image", protect, imageUpload.single("image"), uploadImage);
router.post("/document", protect, documentUpload.single("document"), uploadDocument);

module.exports = router;
