/**
 * models/Bed.js — Bed Model
 *
 * Represents an individual bed inside a room.
 * Each bed belongs to a room and a property.
 *
 * Status lifecycle:
 *   vacant → booked → occupied → vacant (when tenant leaves)
 *   Any status → maintenance (when bed needs repair)
 *
 * Business rules:
 *   - A bed can only be assigned to ONE active tenant at a time
 *   - When a tenant is assigned: status → "occupied", tenantId is set
 *   - When a tenant leaves: status → "vacant", tenantId is removed
 */

const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property ID is required"],
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required"],
    },
    bedNumber: {
      type: String,
      required: [true, "Bed number is required"],
      trim: true,
      // Example: "A", "B", "1", "2", "Bed-1"
    },
    status: {
      type: String,
      enum: {
        values: ["vacant", "occupied", "booked", "maintenance"],
        message: "Status must be: vacant, occupied, booked, or maintenance",
      },
      default: "vacant",
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      // Set when tenant is assigned, cleared when tenant leaves
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
bedSchema.index({ propertyId: 1 });
bedSchema.index({ roomId: 1 });
bedSchema.index({ status: 1 });
bedSchema.index({ tenantId: 1 });
bedSchema.index({ roomId: 1, bedNumber: 1 }, { unique: true }); // Bed number unique within room

const Bed = mongoose.model("Bed", bedSchema);

module.exports = Bed;
