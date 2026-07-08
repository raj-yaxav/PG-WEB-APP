/**
 * controllers/bed.controller.js — Bed Controller
 *
 * Handles CRUD for beds within rooms.
 *
 * Key business logic:
 *   - A bed can only be assigned to ONE active tenant
 *   - Bed status update must respect occupancy rules
 *
 * Routes:
 *   POST   /api/beds            — Create bed
 *   GET    /api/beds            — List beds (paginated)
 *   GET    /api/beds/:id        — Get single bed
 *   PATCH  /api/beds/:id        — Update bed details
 *   PATCH  /api/beds/:id/status — Update bed status only
 *   DELETE /api/beds/:id        — Delete bed
 */

const asyncHandler = require("express-async-handler");
const Bed = require("../models/Bed");
const Tenant = require("../models/Tenant");
const { successResponse } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

/**
 * @desc    Create a new bed
 * @route   POST /api/beds
 * @access  Protected (owner, manager)
 */
const createBed = asyncHandler(async (req, res) => {
  const { propertyId, roomId, bedNumber } = req.body;

  if (!propertyId || !roomId || !bedNumber) {
    res.status(400);
    throw new Error("propertyId, roomId, and bedNumber are required");
  }

  const bed = await Bed.create({ propertyId, roomId, bedNumber });
  res.status(201).json(successResponse("Bed created successfully", bed));
});

/**
 * @desc    Get all beds with pagination and filters
 * @route   GET /api/beds
 * @access  Protected (owner, manager)
 * @query   page, limit, propertyId, roomId, status
 */
const getBeds = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { propertyId, roomId, status } = req.query;

  const filter = {};
  if (propertyId) filter.propertyId = propertyId;
  if (roomId) filter.roomId = roomId;
  if (status) filter.status = status;

  const [beds, total] = await Promise.all([
    Bed.find(filter)
      .select("-__v")
      .populate("roomId", "roomNumber floor")
      .populate("tenantId", "name phone")
      .skip(skip)
      .limit(limit)
      .lean(),
    Bed.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse("Beds fetched successfully", beds, getPaginationMeta(page, limit, total))
  );
});

/**
 * @desc    Get a single bed by ID
 * @route   GET /api/beds/:id
 * @access  Protected (owner, manager)
 */
const getBedById = asyncHandler(async (req, res) => {
  const bed = await Bed.findById(req.params.id)
    .populate("roomId", "roomNumber floor roomType")
    .populate("tenantId", "name phone")
    .select("-__v")
    .lean();

  if (!bed) {
    res.status(404);
    throw new Error("Bed not found");
  }

  res.status(200).json(successResponse("Bed fetched", bed));
});

/**
 * @desc    Update bed details
 * @route   PATCH /api/beds/:id
 * @access  Protected (owner, manager)
 */
const updateBed = asyncHandler(async (req, res) => {
  const bed = await Bed.findById(req.params.id);

  if (!bed) {
    res.status(404);
    throw new Error("Bed not found");
  }

  const allowedFields = ["bedNumber"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      bed[field] = req.body[field];
    }
  });

  await bed.save();
  res.status(200).json(successResponse("Bed updated successfully", bed));
});

/**
 * @desc    Update bed status only
 * @route   PATCH /api/beds/:id/status
 * @access  Protected (owner, manager)
 */
const updateBedStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error("Status is required");
  }

  const bed = await Bed.findById(req.params.id);

  if (!bed) {
    res.status(404);
    throw new Error("Bed not found");
  }

  // Cannot change status of occupied bed to vacant directly — must use mark-left on tenant
  if (bed.status === "occupied" && status === "vacant") {
    res.status(400);
    throw new Error(
      "Cannot directly set occupied bed to vacant. Use the tenant mark-left API instead."
    );
  }

  if (status === "occupied" && !bed.tenantId) {
    res.status(400);
    throw new Error("Cannot mark a bed occupied manually. Assign a tenant to this vacant bed instead.");
  }

  bed.status = status;
  await bed.save();

  res.status(200).json(successResponse("Bed status updated", bed));
});

/**
 * @desc    Delete a bed
 * @route   DELETE /api/beds/:id
 * @access  Protected (owner)
 */
const deleteBed = asyncHandler(async (req, res) => {
  const bed = await Bed.findById(req.params.id).populate("tenantId", "name phone");

  if (!bed) {
    res.status(404);
    throw new Error("Bed not found");
  }

  if (bed.tenantId) {
    res.status(400);
    throw new Error(`Cannot delete this bed because it is assigned to ${bed.tenantId.name || "a tenant"}. Remove the tenant assignment first.`);
  }

  const linkedTenant = await Tenant.findOne({ bedId: bed._id, status: { $ne: "left" } }).select("name phone").lean();
  if (linkedTenant) {
    res.status(400);
    throw new Error(`Cannot delete this bed because it is linked to ${linkedTenant.name || "an active tenant"}. Remove the tenant assignment first.`);
  }

  if (bed.status !== "vacant") {
    res.status(400);
    throw new Error(`Only vacant beds can be deleted. Current status is ${bed.status}.`);
  }

  await bed.deleteOne();
  res.status(200).json(successResponse("Bed deleted successfully", null));
});

module.exports = { createBed, getBeds, getBedById, updateBed, updateBedStatus, deleteBed };
