/**
 * controllers/upload.controller.js — File Upload Controller
 *
 * Handles file uploads via Cloudinary.
 * Multer processes the file in memory, then it's streamed to Cloudinary.
 * Only the Cloudinary URL is stored (not the raw file in MongoDB).
 *
 * Routes:
 *   POST /api/uploads/image    — Upload image (profile photo, complaint image)
 *   POST /api/uploads/document — Upload document (KYC, agreement)
 *
 * Future use:
 *   - Tenant profile photo → profilePhotoUrl
 *   - KYC documents → kycDocumentUrl
 *   - Complaint images → imageUrl
 */

const asyncHandler = require("express-async-handler");
const { uploadToCloudinary } = require("../config/cloudinary");
const { successResponse } = require("../utils/apiResponse");

/**
 * @desc    Upload an image to Cloudinary
 * @route   POST /api/uploads/image
 * @access  Protected (any role)
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image file provided");
  }

  // Upload to Cloudinary using buffer (multer memoryStorage)
  const result = await uploadToCloudinary(req.file.buffer, "pg-management/images", "image");

  res.status(200).json(
    successResponse("Image uploaded successfully", {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    })
  );
});

/**
 * @desc    Upload a document to Cloudinary
 * @route   POST /api/uploads/document
 * @access  Protected (any role)
 */
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No document file provided");
  }

  // Upload as raw resource type (for PDFs, DOCs, etc.)
  const result = await uploadToCloudinary(req.file.buffer, "pg-management/documents", "raw");

  res.status(200).json(
    successResponse("Document uploaded successfully", {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    })
  );
});

module.exports = { uploadImage, uploadDocument };
