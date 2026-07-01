/**
 * routes/complaint.routes.js — Complaint Routes
 *
 * POST   /api/complaints              — Create complaint (all roles)
 * GET    /api/complaints              — List complaints (role-filtered)
 * GET    /api/complaints/:id          — Get single complaint
 * PATCH  /api/complaints/:id/status   — Update status + admin note (owner, manager)
 * DELETE /api/complaints/:id          — Delete complaint (owner only)
 */

const express = require("express");
const router = express.Router();
const {
  createComplaint, getComplaints, getComplaintById,
  updateComplaintStatus, deleteComplaint,
} = require("../controllers/complaint.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

router
  .route("/")
  .post(protect, createComplaint) // All roles can create
  .get(protect, getComplaints);   // Role-based filtering inside controller

router
  .route("/:id")
  .get(protect, getComplaintById)
  .delete(protect, allowRoles("owner"), deleteComplaint);

// Status update — only admin roles
router.patch(
  "/:id/status",
  protect,
  allowRoles("owner", "manager"),
  updateComplaintStatus
);

module.exports = router;
