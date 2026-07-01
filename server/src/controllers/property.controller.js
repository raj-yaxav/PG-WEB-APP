/**
 * controllers/property.controller.js — Property Controller
 *
 * Handles CRUD operations for PG properties.
 * Access: Owner and Manager only (not Tenant).
 *
 * Routes:
 *   POST   /api/properties       — Create property
 *   GET    /api/properties       — List properties (paginated)
 *   GET    /api/properties/:id   — Get single property
 *   PATCH  /api/properties/:id   — Update property
 *   DELETE /api/properties/:id   — Delete property
 */

const asyncHandler = require("express-async-handler");
const Property = require("../models/Property");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

/**
 * @desc    Create a new property
 * @route   POST /api/properties
 * @access  Protected (owner, manager)
 */
const createProperty = asyncHandler(async (req, res) => {
  const { name, address, city, state, pincode, contactPhone, facilities } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Property name is required");
  }

  const property = await Property.create({
    ownerId: req.user._id,
    name,
    address,
    city,
    state,
    pincode,
    contactPhone,
    facilities: facilities || [],
  });

  res.status(201).json(successResponse("Property created successfully", property));
});

/**
 * @desc    Get all properties (with pagination and filters)
 * @route   GET /api/properties
 * @access  Protected (owner, manager)
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

  const allowedFields = ["name", "address", "city", "state", "pincode", "contactPhone", "facilities", "status"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      property[field] = req.body[field];
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
