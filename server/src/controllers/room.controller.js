/**
 * controllers/room.controller.js — Room Controller
 *
 * Handles CRUD for rooms within a property.
 * Supports filtering by propertyId, floor, status, and search by roomNumber.
 *
 * Routes:
 *   POST   /api/rooms       — Create room
 *   GET    /api/rooms       — List rooms (paginated + filtered)
 *   GET    /api/rooms/:id   — Get single room
 *   PATCH  /api/rooms/:id   — Update room
 *   DELETE /api/rooms/:id   — Delete room
 */

const asyncHandler = require("express-async-handler");
const Room = require("../models/Room");
const { successResponse } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

/**
 * @desc    Create a new room
 * @route   POST /api/rooms
 * @access  Protected (owner, manager)
 */
const createRoom = asyncHandler(async (req, res) => {
  const { propertyId, roomNumber, floor, roomType, rentPerBed, facilities } = req.body;

  if (!propertyId || !roomNumber || !rentPerBed) {
    res.status(400);
    throw new Error("propertyId, roomNumber, and rentPerBed are required");
  }

  const room = await Room.create({
    propertyId,
    roomNumber,
    floor,
    roomType: roomType || "single",
    rentPerBed,
    facilities: facilities || [],
  });

  res.status(201).json(successResponse("Room created successfully", room));
});

/**
 * @desc    Get all rooms with pagination and filters
 * @route   GET /api/rooms
 * @access  Protected (owner, manager)
 * @query   page, limit, propertyId, floor, status, search (roomNumber)
 */
const getRooms = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { propertyId, floor, status, search } = req.query;

  const filter = {};
  if (propertyId) filter.propertyId = propertyId;
  if (floor) filter.floor = { $regex: floor, $options: "i" };
  if (status) filter.status = status;
  if (search) filter.roomNumber = { $regex: search, $options: "i" };

  const [rooms, total] = await Promise.all([
    Room.find(filter)
      .select("-__v")
      .populate("propertyId", "name city")
      .skip(skip)
      .limit(limit)
      .lean(),
    Room.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse("Rooms fetched successfully", rooms, getPaginationMeta(page, limit, total))
  );
});

/**
 * @desc    Get a single room by ID
 * @route   GET /api/rooms/:id
 * @access  Protected (owner, manager)
 */
const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id)
    .populate("propertyId", "name city address")
    .select("-__v")
    .lean();

  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  res.status(200).json(successResponse("Room fetched", room));
});

/**
 * @desc    Update a room
 * @route   PATCH /api/rooms/:id
 * @access  Protected (owner, manager)
 */
const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  const allowedFields = ["roomNumber", "floor", "roomType", "rentPerBed", "facilities", "status"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      room[field] = req.body[field];
    }
  });

  await room.save();
  res.status(200).json(successResponse("Room updated successfully", room));
});

/**
 * @desc    Delete a room
 * @route   DELETE /api/rooms/:id
 * @access  Protected (owner)
 */
const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  await room.deleteOne();
  res.status(200).json(successResponse("Room deleted successfully", null));
});

module.exports = { createRoom, getRooms, getRoomById, updateRoom, deleteRoom };
