/**
 * models/Room.js — Room Model
 *
 * Represents a physical room inside a property.
 * Each room belongs to a property and contains multiple beds.
 * roomType determines how many beds are expected (single, double, etc.)
 * rentPerBed is the base rent per bed in this room.
 */

const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property ID is required"],
    },
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
      // Example: "101", "G-1", "F2-3"
    },
    floor: {
      type: String,
      trim: true,
      // Example: "Ground", "1st", "2nd", "Terrace"
    },
    roomType: {
      type: String,
      enum: {
        values: ["single", "double", "triple", "four_sharing", "other"],
        message: "Invalid room type",
      },
      default: "single",
    },
    rentPerBed: {
      type: Number,
      required: [true, "Rent per bed is required"],
      min: [0, "Rent cannot be negative"],
    },
    facilities: {
      type: [String],
      default: [],
      // Example: ["AC", "Non-AC", "Attached Washroom", "Balcony", "Furnished"]
    },
    status: {
      type: String,
      enum: {
        values: ["active", "maintenance", "inactive"],
        message: "Status must be: active, maintenance, or inactive",
      },
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
roomSchema.virtual("beds", {
  ref: "Bed",
  localField: "_id",
  foreignField: "roomId",
  options: { select: "_id bedNumber status tenantId propertyId roomId" },
});

// Ensure virtuals are included in toJSON / toObject output
roomSchema.set("toJSON", { virtuals: true });
roomSchema.set("toObject", { virtuals: true });

// ─── Indexes ──────────────────────────────────────────────────────────────────
roomSchema.index({ propertyId: 1 });
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true }); // Room number unique within property

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
