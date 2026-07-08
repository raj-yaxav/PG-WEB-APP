/**
 * routes/dashboard.routes.js — Dashboard Routes
 *
 * GET /api/dashboard/summary — Get aggregated dashboard stats
 *   Query params: propertyId, month, year
 *   Access: owner, manager only
 */

const express = require("express");
const router = express.Router();
const { getDashboardSummary } = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

router.get("/summary", protect, allowRoles("owner", "manager", "tenant"), getDashboardSummary);

module.exports = router;
