/**
 * controllers/tenant.controller.js — Tenant Controller
 *
 * Handles tenant management including:
 *   - CRUD operations
 *   - Assigning a tenant to a bed (assign-bed)
 *   - Marking a tenant as left (mark-left) and freeing their bed
 *
 * Key business rules:
 *   assign-bed:
 *     1. Check bed exists
 *     2. Check bed status is vacant or booked
 *     3. Assign tenant to bed
 *     4. Update tenant roomId and bedId
 *     5. Update bed status to "occupied"
 *     6. Set bed tenantId
 *
 *   mark-left:
 *     1. Set tenant status to "left"
 *     2. Set bed status to "vacant"
 *     3. Remove tenantId from bed
 *     4. Clear tenant's roomId and bedId
 */

const asyncHandler = require("express-async-handler");
const Tenant = require("../models/Tenant");
const Bed = require("../models/Bed");
const { successResponse } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

/**
 * @desc    Create a new tenant
 * @route   POST /api/tenants
 * @access  Protected (owner, manager)
 */
const createTenant = asyncHandler(async (req, res) => {
  const {
    userId, propertyId, roomId, bedId,
    name, phone, email,
    guardianPhone, emergencyContact, permanentAddress,
    rentAmount, securityDeposit, joiningDate,
    profilePhotoUrl, kycDocumentUrl,
  } = req.body;

  if (!propertyId || !name || !phone || !rentAmount) {
    res.status(400);
    throw new Error("propertyId, name, phone, and rentAmount are required");
  }

  const tenant = await Tenant.create({
    userId: userId || null,
    propertyId, roomId: roomId || null, bedId: bedId || null,
    name, phone, email: email || null,
    guardianPhone, emergencyContact, permanentAddress,
    rentAmount, securityDeposit: securityDeposit || 0,
    joiningDate: joiningDate || Date.now(),
    profilePhotoUrl: profilePhotoUrl || null,
    kycDocumentUrl: kycDocumentUrl || null,
  });

  res.status(201).json(successResponse("Tenant created successfully", tenant));
});

/**
 * @desc    Get all tenants with pagination and filters
 * @route   GET /api/tenants
 * @access  Protected (owner, manager)
 * @query   page, limit, propertyId, status, search (name or phone)
 */
const getTenants = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { propertyId, status, search } = req.query;

  const filter = {};
  if (propertyId) filter.propertyId = propertyId;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const [tenants, total] = await Promise.all([
    Tenant.find(filter)
      .select("-__v -kycDocumentUrl")
      .populate("propertyId", "name city")
      .populate("roomId", "roomNumber floor")
      .populate("bedId", "bedNumber status")
      .skip(skip)
      .limit(limit)
      .lean(),
    Tenant.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse("Tenants fetched successfully", tenants, getPaginationMeta(page, limit, total))
  );
});

/**
 * @desc    Get a single tenant by ID
 * @route   GET /api/tenants/:id
 * @access  Protected (owner, manager)
 */
const getTenantById = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id)
    .select("-__v")
    .populate("propertyId", "name city address")
    .populate("roomId", "roomNumber floor roomType facilities")
    .populate("bedId", "bedNumber status")
    .lean();

  if (!tenant) {
    res.status(404);
    throw new Error("Tenant not found");
  }

  res.status(200).json(successResponse("Tenant fetched", tenant));
});

/**
 * @desc    Update tenant details
 * @route   PATCH /api/tenants/:id
 * @access  Protected (owner, manager)
 */
const updateTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error("Tenant not found");
  }

  const allowedFields = [
    "name", "phone", "email", "guardianPhone", "emergencyContact",
    "permanentAddress", "rentAmount", "securityDeposit", "joiningDate",
    "status", "profilePhotoUrl", "kycDocumentUrl", "kycStatus",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      tenant[field] = req.body[field];
    }
  });

  await tenant.save();
  res.status(200).json(successResponse("Tenant updated successfully", tenant));
});

/**
 * @desc    Assign a bed to a tenant
 * @route   PATCH /api/tenants/:id/assign-bed
 * @access  Protected (owner, manager)
 */
const assignBed = asyncHandler(async (req, res) => {
  const { bedId } = req.body;

  if (!bedId) {
    res.status(400);
    throw new Error("bedId is required");
  }

  // Find bed
  const bed = await Bed.findById(bedId);
  if (!bed) {
    res.status(404);
    throw new Error("Bed not found");
  }

  // Check bed availability
  if (bed.status === "occupied") {
    res.status(400);
    throw new Error("Bed is already occupied. Cannot assign another tenant.");
  }

  if (bed.status === "maintenance") {
    res.status(400);
    throw new Error("Bed is under maintenance. Cannot assign a tenant.");
  }

  // Find tenant
  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) {
    res.status(404);
    throw new Error("Tenant not found");
  }

  // If tenant already has a bed, free the old bed first
  if (tenant.bedId) {
    const oldBed = await Bed.findById(tenant.bedId);
    if (oldBed) {
      oldBed.status = "vacant";
      oldBed.tenantId = null;
      await oldBed.save();
    }
  }

  // Assign new bed to tenant
  tenant.bedId = bed._id;
  tenant.roomId = bed.roomId;
  await tenant.save();

  // Update bed status
  bed.status = "occupied";
  bed.tenantId = tenant._id;
  await bed.save();

  res.status(200).json(
    successResponse("Bed assigned to tenant successfully", {
      tenant: { _id: tenant._id, name: tenant.name, roomId: tenant.roomId, bedId: tenant.bedId },
      bed: { _id: bed._id, bedNumber: bed.bedNumber, status: bed.status },
    })
  );
});

/**
 * @desc    Mark a tenant as left and free their bed
 * @route   PATCH /api/tenants/:id/mark-left
 * @access  Protected (owner, manager)
 */
const markTenantLeft = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error("Tenant not found");
  }

  if (tenant.status === "left") {
    res.status(400);
    throw new Error("Tenant has already been marked as left");
  }

  // Free the bed if assigned
  if (tenant.bedId) {
    const bed = await Bed.findById(tenant.bedId);
    if (bed) {
      bed.status = "vacant";
      bed.tenantId = null;
      await bed.save();
    }
  }

  // Update tenant
  tenant.status = "left";
  tenant.bedId = null;
  tenant.roomId = null;
  await tenant.save();

  res.status(200).json(successResponse("Tenant marked as left. Bed is now vacant.", tenant));
});

/**
 * @desc    Delete a tenant record
 * @route   DELETE /api/tenants/:id
 * @access  Protected (owner)
 */
const deleteTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error("Tenant not found");
  }

  await tenant.deleteOne();
  res.status(200).json(successResponse("Tenant deleted successfully", null));
});

module.exports = {
  createTenant, getTenants, getTenantById,
  updateTenant, assignBed, markTenantLeft, deleteTenant,
};
