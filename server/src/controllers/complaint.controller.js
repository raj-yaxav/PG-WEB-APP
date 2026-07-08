/**
 * controllers/complaint.controller.js — Complaint Controller
 *
 * Access rules:
 *   - Tenant can create a complaint
 *   - Tenant can view ONLY their own complaints
 *   - Owner/Manager can view ALL complaints for a property
 *   - Owner/Manager can update complaint status and add admin notes
 *
 * Routes:
 *   POST   /api/complaints              — Create complaint (tenant)
 *   GET    /api/complaints              — List complaints (filtered by role)
 *   GET    /api/complaints/:id          — Get single complaint
 *   PATCH  /api/complaints/:id/status   — Update status + admin note (owner/manager)
 *   DELETE /api/complaints/:id          — Delete complaint (owner)
 */

const asyncHandler = require("express-async-handler");
const Complaint = require("../models/Complaint");
const Tenant = require("../models/Tenant");
const { successResponse } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Protected (tenant)
 */
const createComplaint = asyncHandler(async (req, res) => {
  const { category, title, description, imageUrl } = req.body;

  if (req.user.role !== "tenant") {
    res.status(403);
    throw new Error("Only tenants can raise complaints. Managers should send reports to the owner.");
  }

  if (!category || !title) {
    res.status(400);
    throw new Error("Category and title are required");
  }

  const tenant = await findTenantForUser(req.user);

  if (!tenant) {
    res.status(404);
    throw new Error("Tenant profile is not linked to this login. Please ask the owner or manager to update the tenant record.");
  }

  const complaint = await Complaint.create({
    tenantId: tenant._id,
    propertyId: tenant.propertyId,
    roomId: tenant.roomId || null,
    category, title,
    description: description || null,
    imageUrl: imageUrl || null,
  });

  res.status(201).json(successResponse("Complaint submitted successfully", complaint));
});

/**
 * @desc    Get all complaints (filtered by role)
 * @route   GET /api/complaints
 * @access  Protected
 * @query   page, limit, tenantId, propertyId, status, category
 */
const getComplaints = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { tenantId, propertyId, status, category } = req.query;

  const filter = {};

  // Role-based filtering:
  // - Tenants only see their own complaints
  // - Owner/Manager can filter by any param
  if (req.user.role === "tenant") {
    const tenant = await findTenantForUser(req.user);
    filter.tenantId = tenant?._id || null;
  } else {
    if (tenantId) filter.tenantId = tenantId;
    if (propertyId) filter.propertyId = propertyId;
  }

  if (status) filter.status = status;
  if (category) filter.category = category;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .select("-__v")
      .populate("tenantId", "name phone")
      .populate("propertyId", "name")
      .populate("roomId", "roomNumber floor")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse("Complaints fetched successfully", complaints, getPaginationMeta(page, limit, total))
  );
});

async function findTenantForUser(user) {
  const lookup = [{ userId: user._id }];
  if (user.phone) lookup.push({ phone: user.phone });
  if (user.email) lookup.push({ email: user.email });

  return Tenant.findOne({ $or: lookup }).select("_id propertyId roomId").lean();
}

/**
 * @desc    Get a single complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Protected
 */
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("tenantId", "name phone email")
    .populate("propertyId", "name city")
    .populate("roomId", "roomNumber floor")
    .select("-__v")
    .lean();

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  res.status(200).json(successResponse("Complaint fetched", complaint));
});

/**
 * @desc    Update complaint status and add admin note
 * @route   PATCH /api/complaints/:id/status
 * @access  Protected (owner, manager)
 */
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;

  if (!status) {
    res.status(400);
    throw new Error("Status is required");
  }

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  complaint.status = status;
  if (adminNote !== undefined) complaint.adminNote = adminNote;

  await complaint.save();
  res.status(200).json(successResponse("Complaint status updated", complaint));
});

/**
 * @desc    Delete a complaint
 * @route   DELETE /api/complaints/:id
 * @access  Protected (owner)
 */
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  await complaint.deleteOne();
  res.status(200).json(successResponse("Complaint deleted successfully", null));
});

module.exports = {
  createComplaint, getComplaints, getComplaintById,
  updateComplaintStatus, deleteComplaint,
};
