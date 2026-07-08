/**
 * controllers/payment.controller.js — Payment Controller
 *
 * Handles payment recording and auto-updates invoice status.
 *
 * Business logic (POST):
 *   1. Create payment record
 *   2. Sum all payments for the invoice
 *   3. If paid >= totalAmount → mark invoice as "paid"
 *   4. If partial → mark invoice as "partially_paid"
 *
 * Routes:
 *   POST   /api/payments       — Record a payment
 *   GET    /api/payments       — List payments (paginated + filtered)
 *   GET    /api/payments/:id   — Get single payment
 *   DELETE /api/payments/:id   — Delete payment (and revert invoice status)
 */

const asyncHandler = require("express-async-handler");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Tenant = require("../models/Tenant");
const { successResponse } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

/**
 * @desc    Record a new payment and auto-update invoice status
 * @route   POST /api/payments
 * @access  Protected (owner, manager)
 */
const createPayment = asyncHandler(async (req, res) => {
  const {
    invoiceId, tenantId, propertyId,
    amount, paymentMode, paymentDate, transactionRef, notes,
  } = req.body;

  if (!invoiceId || !tenantId || !propertyId || !amount || !paymentMode) {
    res.status(400);
    throw new Error("invoiceId, tenantId, propertyId, amount, and paymentMode are required");
  }

  // Find the invoice
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  // Create payment
  const payment = await Payment.create({
    invoiceId, tenantId, propertyId,
    amount, paymentMode,
    paymentDate: paymentDate || Date.now(),
    transactionRef: transactionRef || null,
    notes: notes || null,
  });

  // Calculate total payments for this invoice
  const allPayments = await Payment.find({ invoiceId });
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

  // Update invoice status based on paid amount
  if (totalPaid >= invoice.totalAmount) {
    invoice.status = "paid";
  } else if (totalPaid > 0) {
    invoice.status = "partially_paid";
  } else {
    invoice.status = "unpaid";
  }

  await invoice.save();

  res.status(201).json(
    successResponse("Payment recorded successfully", {
      payment,
      invoiceStatus: invoice.status,
      totalPaid,
      invoiceTotalAmount: invoice.totalAmount,
      remainingAmount: Math.max(0, invoice.totalAmount - totalPaid),
    })
  );
});

/**
 * @desc    Get all payments with pagination and filters
 * @route   GET /api/payments
 * @access  Protected (owner, manager)
 * @query   page, limit, tenantId, invoiceId, propertyId
 */
const getPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { tenantId, invoiceId, propertyId } = req.query;

  const filter = {};

  // Tenants can only see their own payments
  if (req.user.role === "tenant") {
    const tenant = await Tenant.findOne({ userId: req.user._id }).select("_id").lean();
    if (tenant) filter.tenantId = tenant._id;
  } else {
    if (tenantId) filter.tenantId = tenantId;
    if (propertyId) filter.propertyId = propertyId;
  }

  if (invoiceId) filter.invoiceId = invoiceId;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .select("-__v")
      .populate("tenantId", "name phone")
      .populate("invoiceId", "month year totalAmount status")
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse("Payments fetched successfully", payments, getPaginationMeta(page, limit, total))
  );
});

/**
 * @desc    Get a single payment by ID
 * @route   GET /api/payments/:id
 * @access  Protected (owner, manager)
 */
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("tenantId", "name phone email")
    .populate("invoiceId", "month year totalAmount status")
    .populate("propertyId", "name")
    .select("-__v")
    .lean();

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  res.status(200).json(successResponse("Payment fetched", payment));
});

/**
 * @desc    Delete a payment and revert invoice status
 * @route   DELETE /api/payments/:id
 * @access  Protected (owner)
 */
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  const invoiceId = payment.invoiceId;
  await payment.deleteOne();

  // Recalculate invoice status after deletion
  const invoice = await Invoice.findById(invoiceId);
  if (invoice) {
    const remainingPayments = await Payment.find({ invoiceId });
    const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid >= invoice.totalAmount) {
      invoice.status = "paid";
    } else if (totalPaid > 0) {
      invoice.status = "partially_paid";
    } else {
      invoice.status = "unpaid";
    }

    await invoice.save();
  }

  res.status(200).json(successResponse("Payment deleted and invoice status updated", null));
});

module.exports = { createPayment, getPayments, getPaymentById, deletePayment };
