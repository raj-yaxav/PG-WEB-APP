/**
 * controllers/invoice.controller.js — Invoice Controller
 *
 * Handles monthly rent invoice management.
 *
 * totalAmount calculation: rentAmount + extraCharges - discount
 *
 * Routes:
 *   POST   /api/invoices              — Create invoice
 *   GET    /api/invoices              — List invoices (paginated + filtered)
 *   GET    /api/invoices/:id          — Get single invoice
 *   PATCH  /api/invoices/:id          — Update invoice
 *   PATCH  /api/invoices/:id/mark-paid — Mark invoice as paid
 *   DELETE /api/invoices/:id          — Delete invoice
 */

const asyncHandler = require("express-async-handler");
const Invoice = require("../models/Invoice");
const { successResponse } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

/**
 * @desc    Create a new invoice
 * @route   POST /api/invoices
 * @access  Protected (owner, manager)
 */
const createInvoice = asyncHandler(async (req, res) => {
  const {
    tenantId, propertyId, month, year,
    rentAmount, extraCharges, discount, dueDate, paymentLink,
  } = req.body;

  if (!tenantId || !propertyId || !month || !year || !rentAmount) {
    res.status(400);
    throw new Error("tenantId, propertyId, month, year, and rentAmount are required");
  }

  const extra = extraCharges || 0;
  const disc = discount || 0;
  const totalAmount = rentAmount + extra - disc;

  const invoice = await Invoice.create({
    tenantId, propertyId, month, year,
    rentAmount, extraCharges: extra, discount: disc,
    totalAmount,
    dueDate: dueDate || null,
    paymentLink: paymentLink || null,
  });

  res.status(201).json(successResponse("Invoice created successfully", invoice));
});

/**
 * @desc    Get all invoices with pagination and filters
 * @route   GET /api/invoices
 * @access  Protected (owner, manager)
 * @query   page, limit, tenantId, propertyId, status, month, year
 */
const getInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { tenantId, propertyId, status, month, year } = req.query;

  const filter = {};
  if (tenantId) filter.tenantId = tenantId;
  if (propertyId) filter.propertyId = propertyId;
  if (status) filter.status = status;
  if (month) filter.month = month;
  if (year) filter.year = parseInt(year);

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .select("-__v")
      .populate("tenantId", "name phone")
      .populate("propertyId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse("Invoices fetched successfully", invoices, getPaginationMeta(page, limit, total))
  );
});

/**
 * @desc    Get a single invoice by ID
 * @route   GET /api/invoices/:id
 * @access  Protected (owner, manager)
 */
const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("tenantId", "name phone email")
    .populate("propertyId", "name city")
    .select("-__v")
    .lean();

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  res.status(200).json(successResponse("Invoice fetched", invoice));
});

/**
 * @desc    Update an invoice
 * @route   PATCH /api/invoices/:id
 * @access  Protected (owner, manager)
 */
const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  const allowedFields = [
    "month", "year", "rentAmount", "extraCharges",
    "discount", "dueDate", "paymentLink", "status",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      invoice[field] = req.body[field];
    }
  });

  // Recalculate totalAmount if financial fields changed
  invoice.totalAmount = invoice.rentAmount + (invoice.extraCharges || 0) - (invoice.discount || 0);

  await invoice.save();
  res.status(200).json(successResponse("Invoice updated successfully", invoice));
});

/**
 * @desc    Mark invoice as paid
 * @route   PATCH /api/invoices/:id/mark-paid
 * @access  Protected (owner, manager)
 */
const markInvoicePaid = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  invoice.status = "paid";
  await invoice.save();

  res.status(200).json(successResponse("Invoice marked as paid", invoice));
});

/**
 * @desc    Delete an invoice
 * @route   DELETE /api/invoices/:id
 * @access  Protected (owner)
 */
const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  await invoice.deleteOne();
  res.status(200).json(successResponse("Invoice deleted successfully", null));
});

module.exports = {
  createInvoice, getInvoices, getInvoiceById,
  updateInvoice, markInvoicePaid, deleteInvoice,
};
