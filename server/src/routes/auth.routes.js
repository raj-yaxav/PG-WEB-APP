/**
 * routes/auth.routes.js — Authentication Routes
 *
 * POST   /api/auth/register  — Register new user
 * POST   /api/auth/login     — Login with owner email or assigned ID + password
 * GET    /api/auth/me        — Get current user (protected)
 */

const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, getMe);

module.exports = router;
