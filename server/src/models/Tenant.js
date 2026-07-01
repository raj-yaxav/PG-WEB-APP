/**
 * models/Tenant.js — Tenant Model
 *
 * Represents a tenant (paying guest) living in the PG.
 * A tenant is linked to a User account (optional), a property, a room, and a bed.
 *
 * Status lifecycle:
 *   active → notice (tenant gives notice) → left (tenant has vacated)
 *
 * KYC:
 *   Documents are stored as Cloudinary URLs, not raw files.
 *   kycStatus tracks verification by admin.
 */

const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // Optional: linked User account for mobile app login
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
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Tenant name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    guardianPhone: {
      type: String,
      trim: true,
      default: null,
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: null,
    },
    permanentAddress: {
      type: String,
      trim: true,
      default: null,
    },
    rentAmount: {
      type: Number,
      required: [true, "Rent amount is required"],
      min: [0, "Rent cannot be negative"],
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, "Security deposit cannot be negative"],
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "notice", "left"],
        message: "Status must be: active, notice, or left",
      },
      default: "active",
    },
    profilePhotoUrl: {
      type: String,
      default: null,
      // Cloudinary URL for tenant's profile photo
    },
    kycDocumentUrl: {
      type: String,
      default: null,
      // Cloudinary URL for KYC document (Aadhar, PAN, etc.)
    },
    kycStatus: {
      type: String,
      enum: {
        values: ["pending", "verified", "rejected"],
        message: "KYC status must be: pending, verified, or rejected",
      },
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
tenantSchema.index({ propertyId: 1 });
tenantSchema.index({ roomId: 1 });
tenantSchema.index({ bedId: 1 });
tenantSchema.index({ phone: 1 });
tenantSchema.index({ status: 1 });

const Tenant = mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;
