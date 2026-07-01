/**
 * models/Property.js — Property Model
 *
 * Represents a PG property/hostel managed by an owner.
 * One owner can have multiple properties.
 * Each property has rooms, beds, and tenants linked by propertyId.
 */

const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
    },
    name: {
      type: String,
      required: [true, "Property name is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    facilities: {
      type: [String],
      default: [],
      // Example: ["WiFi", "CCTV", "24x7 Water", "Parking", "Laundry"]
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be active or inactive",
      },
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
propertySchema.index({ ownerId: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ city: 1 });

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
