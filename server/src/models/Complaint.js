/**
 * models/Complaint.js — Complaint Model
 *
 * Represents a maintenance or service complaint raised by a tenant.
 *
 * Access rules:
 *   - Tenant can create and view their own complaints
 *   - Owner/Manager can view all complaints for a property
 *   - Owner/Manager can update complaint status and add admin notes
 *
 * Image upload:
 *   - Tenant can optionally attach an image (Cloudinary URL)
 *   - Not stored directly in MongoDB
 */

const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "Tenant ID is required"],
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property ID is required"],
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    category: {
      type: String,
      enum: {
        values: ["electricity", "water", "wifi", "cleaning", "food", "furniture", "request", "update", "other"],
        message: "Invalid complaint category",
      },
      required: [true, "Category is required"],
    },
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
      // Cloudinary URL for complaint image (optional)
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "in_progress", "resolved"],
        message: "Status must be: pending, in_progress, or resolved",
      },
      default: "pending",
    },
    adminNote: {
      type: String,
      trim: true,
      default: null,
      // Admin's response/note when updating the complaint status
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
complaintSchema.index({ tenantId: 1 });
complaintSchema.index({ propertyId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
