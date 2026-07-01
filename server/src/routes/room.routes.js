/**
 * routes/room.routes.js — Room Routes
 *
 * POST   /api/rooms       — Create room (owner, manager)
 * GET    /api/rooms       — List rooms with filters (owner, manager)
 * GET    /api/rooms/:id   — Get single room (owner, manager)
 * PATCH  /api/rooms/:id   — Update room (owner, manager)
 * DELETE /api/rooms/:id   — Delete room (owner only)
 */

const express = require("express");
const router = express.Router();
const {
  createRoom, getRooms, getRoomById, updateRoom, deleteRoom,
} = require("../controllers/room.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

router
  .route("/")
  .post(protect, allowRoles("owner", "manager"), createRoom)
  .get(protect, allowRoles("owner", "manager"), getRooms);

router
  .route("/:id")
  .get(protect, allowRoles("owner", "manager"), getRoomById)
  .patch(protect, allowRoles("owner", "manager"), updateRoom)
  .delete(protect, allowRoles("owner"), deleteRoom);

module.exports = router;
