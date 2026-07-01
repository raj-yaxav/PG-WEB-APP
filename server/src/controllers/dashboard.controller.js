/**
 * controllers/dashboard.controller.js — Dashboard Summary Controller
 *
 * Returns aggregated stats for the admin dashboard.
 *
 * Accepts query params:
 *   - propertyId (required for meaningful data)
 *   - month (for invoice stats)
 *   - year  (for invoice stats)
 *
 * Returns:
 *   - totalRooms, totalBeds, occupiedBeds, vacantBeds, bookedBeds, maintenanceBeds
 *   - activeTenants
 *   - monthlyExpectedRent (sum of rentAmount for active tenants)
 *   - monthlyCollectedRent (sum of paid/partially paid invoices)
 *   - pendingDues (sum of unpaid + partially_paid invoice balances)
 *   - openComplaints (pending + in_progress count)
 *
 * Access: Owner and Manager only
 */

const asyncHandler = require("express-async-handler");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const Tenant = require("../models/Tenant");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Complaint = require("../models/Complaint");
const { successResponse } = require("../utils/apiResponse");

/**
 * @desc    Get dashboard summary stats
 * @route   GET /api/dashboard/summary
 * @access  Protected (owner, manager)
 * @query   propertyId, month, year
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const { propertyId, month, year } = req.query;

  // Build base filter
  const baseFilter = {};
  if (propertyId) baseFilter.propertyId = propertyId;

  // ── Room Stats ──────────────────────────────────────────────────────────────
  const totalRooms = await Room.countDocuments({
    ...baseFilter,
    status: "active",
  });

  // ── Bed Stats ───────────────────────────────────────────────────────────────
  const [totalBeds, occupiedBeds, vacantBeds, bookedBeds, maintenanceBeds] = await Promise.all([
    Bed.countDocuments(baseFilter),
    Bed.countDocuments({ ...baseFilter, status: "occupied" }),
    Bed.countDocuments({ ...baseFilter, status: "vacant" }),
    Bed.countDocuments({ ...baseFilter, status: "booked" }),
    Bed.countDocuments({ ...baseFilter, status: "maintenance" }),
  ]);

  // ── Tenant Stats ─────────────────────────────────────────────────────────────
  const activeTenants = await Tenant.countDocuments({
    ...baseFilter,
    status: "active",
  });

  // Monthly expected rent (sum of all active tenants' rentAmount)
  const rentAggregation = await Tenant.aggregate([
    { $match: { ...(propertyId ? { propertyId: require("mongoose").Types.ObjectId.createFromHexString(propertyId) } : {}), status: "active" } },
    { $group: { _id: null, totalExpected: { $sum: "$rentAmount" } } },
  ]);
  const monthlyExpectedRent = rentAggregation[0]?.totalExpected || 0;

  // ── Invoice Stats (month/year) ───────────────────────────────────────────────
  const invoiceFilter = { ...baseFilter };
  if (month) invoiceFilter.month = month;
  if (year) invoiceFilter.year = parseInt(year);

  // Monthly collected rent (payments for that month's invoices)
  const paidInvoices = await Invoice.find({
    ...invoiceFilter,
    status: { $in: ["paid", "partially_paid"] },
  }).select("tenantId totalAmount").lean();

  const paidInvoiceIds = paidInvoices.map((inv) => inv._id);

  const paymentAgg = await Payment.aggregate([
    { $match: { invoiceId: { $in: paidInvoiceIds } } },
    { $group: { _id: null, totalCollected: { $sum: "$amount" } } },
  ]);
  const monthlyCollectedRent = paymentAgg[0]?.totalCollected || 0;

  // Pending dues (total outstanding for unpaid and partially paid invoices)
  const unpaidInvoices = await Invoice.find({
    ...invoiceFilter,
    status: { $in: ["unpaid", "partially_paid"] },
  }).select("totalAmount").lean();

  const unpaidPaymentsAgg = await Payment.aggregate([
    {
      $match: {
        invoiceId: {
          $in: await Invoice.find({
            ...invoiceFilter,
            status: { $in: ["unpaid", "partially_paid"] },
          }).distinct("_id"),
        },
      },
    },
    { $group: { _id: "$invoiceId", totalPaid: { $sum: "$amount" } } },
  ]);

  const paidMap = {};
  unpaidPaymentsAgg.forEach((p) => {
    paidMap[p._id.toString()] = p.totalPaid;
  });

  const pendingDues = unpaidInvoices.reduce((sum, inv) => {
    const paid = paidMap[inv._id.toString()] || 0;
    return sum + Math.max(0, inv.totalAmount - paid);
  }, 0);

  // ── Complaint Stats ───────────────────────────────────────────────────────────
  const openComplaints = await Complaint.countDocuments({
    ...baseFilter,
    status: { $in: ["pending", "in_progress"] },
  });

  res.status(200).json(
    successResponse("Dashboard summary fetched", {
      rooms: { totalRooms },
      beds: { totalBeds, occupiedBeds, vacantBeds, bookedBeds, maintenanceBeds },
      tenants: { activeTenants },
      rent: { monthlyExpectedRent, monthlyCollectedRent, pendingDues },
      complaints: { openComplaints },
      filters: { propertyId: propertyId || null, month: month || null, year: year || null },
    })
  );
});

module.exports = { getDashboardSummary };
