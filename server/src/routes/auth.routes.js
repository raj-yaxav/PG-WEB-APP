/**
 * routes/auth.routes.js — Authentication Routes
 *
 * POST   /api/auth/register  — Register new user
 * POST   /api/auth/login     — Login with owner email or assigned ID + password
 * GET    /api/auth/me        — Get current user (protected)
 */

const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  verifyPassword,
  createManager,
  getManagers,
  deleteManager,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.route("/me").get(protect, getMe).patch(protect, updateMe);
router.patch("/change-password", protect, changePassword);
router.post("/verify-password", protect, verifyPassword);
router
  .route("/managers")
  .get(protect, allowRoles("owner"), getManagers)
  .post(protect, allowRoles("owner"), createManager);
router.delete("/managers/:id", protect, allowRoles("owner"), deleteManager);

module.exports = router;
