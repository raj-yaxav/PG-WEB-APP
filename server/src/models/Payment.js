/**
 * models/Payment.js — Payment Model
 *
 * Represents a payment made against an invoice.
 * Multiple partial payments can be made against one invoice.
 *
 * After a payment is recorded:
 *   - Sum all payments for the invoice
 *   - If total paid >= invoice totalAmount → mark invoice as "paid"
 *   - If partial → mark invoice as "partially_paid"
 *
 * Payment modes:
 *   cash, upi, bank_transfer, razorpay_link
 */

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: [true, "Invoice ID is required"],
    },
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
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [1, "Payment amount must be greater than 0"],
    },
    paymentMode: {
      type: String,
      enum: {
        values: ["cash", "upi", "bank_transfer", "razorpay_link"],
        message: "Payment mode must be: cash, upi, bank_transfer, or razorpay_link",
      },
      required: [true, "Payment mode is required"],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    transactionRef: {
      type: String,
      trim: true,
      default: null,
      // UPI transaction ID, bank reference number, etc.
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
paymentSchema.index({ invoiceId: 1 });
paymentSchema.index({ tenantId: 1 });
paymentSchema.index({ propertyId: 1 });
paymentSchema.index({ paymentDate: -1 }); // Sorted by date descending

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
