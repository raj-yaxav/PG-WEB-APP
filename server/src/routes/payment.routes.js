/**
 * routes/payment.routes.js — Payment Routes
 *
 * POST   /api/payments       — Record a payment (auto-updates invoice status)
 * GET    /api/payments       — List payments (paginated + filtered)
 * GET    /api/payments/:id   — Get single payment
 * DELETE /api/payments/:id   — Delete payment (reverts invoice status)
 */

const express = require("express");
const router = express.Router();
const {
  createPayment, getPayments, getPaymentById, deletePayment,
} = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

router
  .route("/")
  .post(protect, allowRoles("owner", "manager"), createPayment)
  .get(protect, allowRoles("owner", "manager"), getPayments);

router
  .route("/:id")
  .get(protect, allowRoles("owner", "manager"), getPaymentById)
  .delete(protect, allowRoles("owner"), deletePayment);

module.exports = router;
