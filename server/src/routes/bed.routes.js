/**
 * routes/bed.routes.js — Bed Routes
 *
 * POST   /api/beds               — Create bed
 * GET    /api/beds               — List beds (filtered)
 * GET    /api/beds/:id           — Get single bed
 * PATCH  /api/beds/:id           — Update bed details
 * PATCH  /api/beds/:id/status    — Update bed status only
 * DELETE /api/beds/:id           — Delete bed (owner only)
 */

const express = require("express");
const router = express.Router();
const {
  createBed, getBeds, getBedById,
  updateBed, updateBedStatus, deleteBed,
} = require("../controllers/bed.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

router
  .route("/")
  .post(protect, allowRoles("owner", "manager"), createBed)
  .get(protect, allowRoles("owner", "manager"), getBeds);

router
  .route("/:id")
  .get(protect, allowRoles("owner", "manager"), getBedById)
  .patch(protect, allowRoles("owner", "manager"), updateBed)
  .delete(protect, allowRoles("owner"), deleteBed);

// Status-only update endpoint
router.patch("/:id/status", protect, allowRoles("owner", "manager"), updateBedStatus);

module.exports = router;
