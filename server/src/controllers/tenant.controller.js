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
const Room = require("../models/Room");
const Property = require("../models/Property");
const User = require("../models/User");
const { successResponse } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

async function generateTenantLoginId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const loginId = `TEN-${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await User.exists({ loginId });
    if (!existing) return loginId;
  }

  return `TEN-${Date.now().toString().slice(-6)}`;
}

function getOccupiedBedMessage(bed) {
  const tenantName = bed.tenantId?.name || "another tenant";
  return `Bed ${bed.bedNumber} is already assigned to ${tenantName}. Please select a vacant bed.`;
}

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
    profilePhotoUrl, kycDocumentUrl, loginId, password,
  } = req.body;

  if (!propertyId || !name || !phone || !rentAmount) {
    res.status(400);
    throw new Error("propertyId, name, phone, and rentAmount are required");
  }

  const propertyBedCount = await Bed.countDocuments({ propertyId });
  if (propertyBedCount === 0) {
    res.status(400);
    throw new Error("This property has no beds. Add rooms and beds before adding a tenant.");
  }

  if (!bedId) {
    res.status(400);
    throw new Error("Select a vacant bed before adding a tenant.");
  }

  const selectedBed = await Bed.findById(bedId).populate("tenantId", "name phone");
  if (!selectedBed) {
    res.status(404);
    throw new Error("Selected bed not found");
  }

  if (String(selectedBed.propertyId) !== String(propertyId)) {
    res.status(400);
    throw new Error("Selected bed does not belong to this property.");
  }

  if (selectedBed.status !== "vacant" || selectedBed.tenantId) {
    res.status(400);
    throw new Error(selectedBed.tenantId ? getOccupiedBedMessage(selectedBed) : `Bed ${selectedBed.bedNumber} is ${selectedBed.status}. Please select a vacant bed.`);
  }

  let tenantUserId = userId || null;
  let accountCredentials = null;

  if (!tenantUserId) {
    const tenantLoginId = (loginId && loginId.trim().toUpperCase()) || await generateTenantLoginId();
    const tenantPassword = password || `Tenant@${tenantLoginId.replace(/\D/g, "") || "1234"}`;

    const existingLogin = await User.findOne({ loginId: tenantLoginId });
    if (existingLogin) {
      res.status(409);
      throw new Error("Tenant login ID already exists");
    }

    const tenantUser = await User.create({
      name,
      phone,
      email: email || undefined,
      loginId: tenantLoginId,
      password: tenantPassword,
      role: "tenant",
      status: "active",
    });

    tenantUserId = tenantUser._id;
    accountCredentials = {
      loginId: tenantLoginId,
      password: tenantPassword,
    };
  }

  const tenant = await Tenant.create({
    userId: tenantUserId,
    propertyId, roomId: selectedBed.roomId, bedId: selectedBed._id,
    name, phone, email: email || null,
    guardianPhone, emergencyContact, permanentAddress,
    rentAmount, securityDeposit: securityDeposit || 0,
    joiningDate: joiningDate || Date.now(),
    profilePhotoUrl: profilePhotoUrl || null,
    kycDocumentUrl: kycDocumentUrl || null,
  });

  selectedBed.status = "occupied";
  selectedBed.tenantId = tenant._id;
  await selectedBed.save();

  res.status(201).json(successResponse("Tenant created successfully", {
    tenant,
    accountCredentials,
  }));
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

  if (req.body.status === "left" && tenant.bedId) {
    const bed = await Bed.findById(tenant.bedId);
    if (bed) {
      bed.status = "vacant";
      bed.tenantId = null;
      await bed.save();
    }
    tenant.bedId = null;
    tenant.roomId = null;
  }

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

  // Passing null/empty bedId removes current room/bed assignment.
  if (!bedId) {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      res.status(404);
      throw new Error("Tenant not found");
    }

    if (tenant.bedId) {
      const oldBed = await Bed.findById(tenant.bedId);
      if (oldBed) {
        oldBed.status = "vacant";
        oldBed.tenantId = null;
        await oldBed.save();
      }
    }

    tenant.bedId = null;
    tenant.roomId = null;
    await tenant.save();

    res.status(200).json(successResponse("Room and bed assignment removed", tenant));
    return;
  }

  // Find bed
  const bed = await Bed.findById(bedId).populate("tenantId", "name phone");
  if (!bed) {
    res.status(404);
    throw new Error("Bed not found");
  }

  // Find tenant
  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) {
    res.status(404);
    throw new Error("Tenant not found");
  }

  if (String(bed.propertyId) !== String(tenant.propertyId)) {
    res.status(400);
    throw new Error("Selected bed does not belong to this tenant's property.");
  }

  // Check bed availability
  if (bed.status !== "vacant" || bed.tenantId) {
    res.status(400);
    throw new Error(bed.tenantId ? getOccupiedBedMessage(bed) : `Bed ${bed.bedNumber} is ${bed.status}. Please select a vacant bed.`);
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
 * @access  Protected (owner, manager)
 */
const deleteTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error("Tenant not found");
  }

  if (tenant.bedId) {
    const bed = await Bed.findById(tenant.bedId);
    if (bed) {
      bed.status = "vacant";
      bed.tenantId = null;
      await bed.save();
    }
  }

  await tenant.deleteOne();
  res.status(200).json(successResponse("Tenant deleted successfully", null));
});

/**
 * @desc    Get logged-in tenant's room details
 * @route   GET /api/tenants/me/room
 * @access  Protected (tenant)
 */
const getMyRoom = asyncHandler(async (req, res) => {
  if (req.user.role !== "tenant") {
    res.status(403);
    throw new Error("Only tenants can access their room");
  }

  const tenant = await Tenant.findOne({ userId: req.user._id })
    .select("name phone email propertyId roomId bedId rentAmount joiningDate status")
    .lean();

  if (!tenant) {
    res.status(404);
    throw new Error("Tenant profile not found");
  }

  const [room, property, bed] = await Promise.all([
    tenant.roomId ? Room.findById(tenant.roomId).select("roomNumber floor roomType rentPerBed facilities status").lean() : null,
    tenant.propertyId ? Property.findById(tenant.propertyId).select("name city address").lean() : null,
    tenant.bedId ? Bed.findById(tenant.bedId).select("bedNumber status").lean() : null,
  ]);

  res.status(200).json(
    successResponse("Room details fetched", {
      tenant: {
        id: tenant._id,
        name: tenant.name,
        phone: tenant.phone,
        email: tenant.email,
        joiningDate: tenant.joiningDate,
        status: tenant.status,
      },
      property: property || null,
      room: room || null,
      bed: bed || null,
      rentAmount: tenant.rentAmount,
    })
  );
});

module.exports = {
  createTenant, getTenants, getTenantById,
  updateTenant, assignBed, markTenantLeft, deleteTenant,
  getMyRoom,
};
