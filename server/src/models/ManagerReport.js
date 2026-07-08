const mongoose = require("mongoose");

const managerReportSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: ["daily_update", "maintenance", "tenant_issue", "payment", "incident", "other"],
      default: "daily_update",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["submitted", "reviewed", "closed"],
      default: "submitted",
      index: true,
    },
    ownerNote: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

managerReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ManagerReport", managerReportSchema);
