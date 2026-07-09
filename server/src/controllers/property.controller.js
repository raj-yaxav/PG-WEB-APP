/**
 * controllers/property.controller.js — Property Controller
 *
 * Handles CRUD operations for PG properties.
 * Access: Owner manages CRUD. Owner and manager can read lists for selection.
 *
 * Routes:
 *   POST   /api/properties       — Create property (owner)
 *   GET    /api/properties       — List properties (paginated)
 *   GET    /api/properties/:id   — Get single property
 *   PATCH  /api/properties/:id   — Update property (owner)
 *   DELETE /api/properties/:id   — Delete property
 */

const asyncHandler = require("express-async-handler");
const Property = require("../models/Property");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const Tenant = require("../models/Tenant");
const { successResponse } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

const phonePattern = /^[0-9+\-\s()]{8,15}$/;
const pincodePattern = /^[1-9][0-9]{5}$/;

const cleanText = (value) => (typeof value === "string" ? value.trim() : value);

function assertPropertyInput(res, { name, pincode, contactPhone }) {
  if (!cleanText(name)) {
    res.status(400);
    throw new Error("Property name is required");
  }

  if (cleanText(pincode) && !pincodePattern.test(cleanText(pincode))) {
    res.status(400);
    throw new Error("Enter a valid 6 digit pincode");
  }

  if (cleanText(contactPhone) && !phonePattern.test(cleanText(contactPhone))) {
    res.status(400);
    throw new Error("Enter a valid contact phone number");
  }
}

async function assertUniquePropertyName(res, ownerId, name, excludeId = null) {
  const filter = {
    ownerId,
    name: { $regex: `^${escapeRegex(cleanText(name))}$`, $options: "i" },
  };

  if (excludeId) filter._id = { $ne: excludeId };

  const existing = await Property.findOne(filter).select("_id").lean();
  if (existing) {
    res.status(409);
    throw new Error("A property with this name already exists");
  }
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertOwnerPropertyAccess(res, property, user) {
  if (user.role === "owner" && String(property.ownerId) !== String(user._id)) {
    res.status(403);
    throw new Error("You can only manage your own properties");
  }
}

/**
 * @desc    Create a new property
 * @route   POST /api/properties
 * @access  Protected (owner, manager)
 */
const createProperty = asyncHandler(async (req, res) => {
  const { name, address, city, state, pincode, contactPhone, facilities, status } = req.body;

  assertPropertyInput(res, { name, pincode, contactPhone });
  await assertUniquePropertyName(res, req.user._id, name);

  const property = await Property.create({
    ownerId: req.user._id,
    name: cleanText(name),
    address: cleanText(address),
    city: cleanText(city),
    state: cleanText(state),
    pincode: cleanText(pincode),
    contactPhone: cleanText(contactPhone),
    facilities: facilities || [],
    status: status === "inactive" ? "inactive" : "active",
  });

  res.status(201).json(successResponse("Property created successfully", property));
});

/**
 * @desc    Get all properties (with pagination and filters)
 * @route   GET /api/properties
 * @access  Protected (owner)
 */
const getProperties = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, city, search } = req.query;

  // Build filter
  const filter = {};

  // Owner only sees their own properties; manager can be extended later
  if (req.user.role === "owner") {
    filter.ownerId = req.user._id;
  }

  if (status) filter.status = status;
  if (city) filter.city = { $regex: city, $options: "i" };
  if (search) filter.name = { $regex: search, $options: "i" };

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .select("-__v")
      .skip(skip)
      .limit(limit)
      .lean(),
    Property.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse(
      "Properties fetched successfully",
      properties,
      getPaginationMeta(page, limit, total)
    )
  );
});

/**
 * @desc    Get a single property by ID
 * @route   GET /api/properties/:id
 * @access  Protected (owner, manager)
 */
const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).select("-__v").lean();

  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }

  assertOwnerPropertyAccess(res, property, req.user);

  res.status(200).json(successResponse("Property fetched", property));
});

/**
 * @desc    Update a property
 * @route   PATCH /api/properties/:id
 * @access  Protected (owner, manager)
 */
const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }

  assertOwnerPropertyAccess(res, property, req.user);

  assertPropertyInput(res, {
    name: req.body.name ?? property.name,
    pincode: req.body.pincode ?? property.pincode,
    contactPhone: req.body.contactPhone ?? property.contactPhone,
  });

  if (req.body.name !== undefined) {
    await assertUniquePropertyName(res, req.user._id, req.body.name, property._id);
  }

  const allowedFields = ["name", "address", "city", "state", "pincode", "contactPhone", "facilities", "status"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      property[field] = Array.isArray(req.body[field]) ? req.body[field] : cleanText(req.body[field]);
    }
  });

  await property.save();

  res.status(200).json(successResponse("Property updated successfully", property));
});

/**
 * @desc    Delete a property
 * @route   DELETE /api/properties/:id
 * @access  Protected (owner only)
 */
const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }

  assertOwnerPropertyAccess(res, property, req.user);

  const [roomCount, bedCount, tenantCount] = await Promise.all([
    Room.countDocuments({ propertyId: property._id }),
    Bed.countDocuments({ propertyId: property._id }),
    Tenant.countDocuments({ propertyId: property._id }),
  ]);

  if (roomCount || bedCount || tenantCount) {
    res.status(400);
    throw new Error("Cannot delete property while rooms, beds, or tenants are linked. Mark it inactive instead.");
  }

  await property.deleteOne();

  res.status(200).json(successResponse("Property deleted successfully", null));
});

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
};
