/**
 * routes/property.routes.js — Property Routes
 *
 * POST   /api/properties       — Create property (owner)
 * GET    /api/properties       — List properties (owner, manager)
 * GET    /api/properties/:id   — Get property (owner, manager)
 * PATCH  /api/properties/:id   — Update property (owner)
 * DELETE /api/properties/:id   — Delete property (owner only)
 */

const express = require("express");
const router = express.Router();
const {
  createProperty, getProperties, getPropertyById,
  updateProperty, deleteProperty,
} = require("../controllers/property.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

router
  .route("/")
  .post(protect, allowRoles("owner"), createProperty)
  .get(protect, allowRoles("owner", "manager"), getProperties);

router
  .route("/:id")
  .get(protect, allowRoles("owner", "manager"), getPropertyById)
  .patch(protect, allowRoles("owner"), updateProperty)
  .delete(protect, allowRoles("owner"), deleteProperty);

module.exports = router;
