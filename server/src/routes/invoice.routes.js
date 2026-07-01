/**
 * routes/invoice.routes.js — Invoice Routes
 *
 * POST   /api/invoices              — Create invoice
 * GET    /api/invoices              — List invoices (paginated + filtered)
 * GET    /api/invoices/:id          — Get single invoice
 * PATCH  /api/invoices/:id          — Update invoice
 * PATCH  /api/invoices/:id/mark-paid — Mark invoice as paid
 * DELETE /api/invoices/:id          — Delete invoice (owner only)
 */

const express = require("express");
const router = express.Router();
const {
  createInvoice, getInvoices, getInvoiceById,
  updateInvoice, markInvoicePaid, deleteInvoice,
} = require("../controllers/invoice.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

router
  .route("/")
  .post(protect, allowRoles("owner", "manager"), createInvoice)
  .get(protect, allowRoles("owner", "manager"), getInvoices);

router
  .route("/:id")
  .get(protect, allowRoles("owner", "manager"), getInvoiceById)
  .patch(protect, allowRoles("owner", "manager"), updateInvoice)
  .delete(protect, allowRoles("owner"), deleteInvoice);

// Mark paid action
router.patch("/:id/mark-paid", protect, allowRoles("owner", "manager"), markInvoicePaid);

module.exports = router;
