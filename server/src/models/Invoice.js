/**
 * models/Invoice.js — Invoice Model
 *
 * Represents a monthly rent invoice for a tenant.
 * totalAmount is calculated as: rentAmount + extraCharges - discount
 *
 * Payment status:
 *   unpaid → partially_paid → paid
 *
 * Razorpay payment link can be pasted manually by admin.
 * Webhook integration is planned for later versions (not MVP).
 */

const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
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
    month: {
      type: String,
      required: [true, "Month is required"],
      // Example: "January", "February", etc. or "01", "02"
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      // Example: 2024, 2025
    },
    rentAmount: {
      type: Number,
      required: [true, "Rent amount is required"],
      min: [0, "Rent cannot be negative"],
    },
    extraCharges: {
      type: Number,
      default: 0,
      min: [0, "Extra charges cannot be negative"],
      // Example: electricity, maintenance charges, etc.
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      // Calculated as: rentAmount + extraCharges - discount
    },
    dueDate: {
      type: Date,
      default: null,
    },
    paymentLink: {
      type: String,
      default: null,
      // Razorpay payment link pasted manually by admin
    },
    status: {
      type: String,
      enum: {
        values: ["paid", "unpaid", "partially_paid"],
        message: "Status must be: paid, unpaid, or partially_paid",
      },
      default: "unpaid",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
invoiceSchema.index({ tenantId: 1 });
invoiceSchema.index({ propertyId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ month: 1, year: 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
