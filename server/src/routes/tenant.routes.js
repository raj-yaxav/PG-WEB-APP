/**
 * routes/tenant.routes.js — Tenant Routes
 *
 * POST   /api/tenants                  — Create tenant
 * GET    /api/tenants                  — List tenants (paginated + filtered)
 * GET    /api/tenants/:id              — Get single tenant
 * PATCH  /api/tenants/:id              — Update tenant
 * PATCH  /api/tenants/:id/assign-bed   — Assign bed to tenant
 * PATCH  /api/tenants/:id/mark-left    — Mark tenant as left (frees bed)
 * DELETE /api/tenants/:id              — Delete tenant (owner only)
 */

const express = require("express");
const router = express.Router();
const {
  createTenant, getTenants, getTenantById,
  updateTenant, assignBed, markTenantLeft, deleteTenant,
} = require("../controllers/tenant.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

router
  .route("/")
  .post(protect, allowRoles("owner", "manager"), createTenant)
  .get(protect, allowRoles("owner", "manager"), getTenants);

router
  .route("/:id")
  .get(protect, allowRoles("owner", "manager"), getTenantById)
  .patch(protect, allowRoles("owner", "manager"), updateTenant)
  .delete(protect, allowRoles("owner"), deleteTenant);

// Business action routes
router.patch("/:id/assign-bed", protect, allowRoles("owner", "manager"), assignBed);
router.patch("/:id/mark-left", protect, allowRoles("owner", "manager"), markTenantLeft);

module.exports = router;
