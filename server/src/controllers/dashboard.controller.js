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
const mongoose = require("mongoose");
const Property = require("../models/Property");
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

  if (req.user.role === "tenant") {
    const tenant = await Tenant.findOne({ userId: req.user._id })
      .select("name phone email propertyId roomId bedId rentAmount status")
      .populate("propertyId", "name city address")
      .populate("roomId", "roomNumber floor roomType")
      .populate("bedId", "bedNumber status")
      .lean();

    if (!tenant) {
      res.status(404);
      throw new Error("Tenant profile not found");
    }

    const [openComplaints, latestInvoice, recentPayments] = await Promise.all([
      Complaint.countDocuments({
        tenantId: tenant._id,
        status: { $in: ["pending", "in_progress"] },
      }),
      Invoice.findOne({ tenantId: tenant._id })
        .sort({ year: -1, createdAt: -1 })
        .select("totalAmount dueDate status paymentLink month year")
        .lean(),
      Payment.find({ tenantId: tenant._id })
        .sort({ paymentDate: -1 })
        .limit(3)
        .select("amount paymentMode paymentDate")
        .lean(),
    ]);

    const paidAmount = latestInvoice
      ? await Payment.aggregate([
          { $match: { invoiceId: latestInvoice._id } },
          { $group: { _id: null, totalPaid: { $sum: "$amount" } } },
        ])
      : [];
    const paid = paidAmount[0]?.totalPaid || 0;
    const totalDue = latestInvoice?.totalAmount || tenant.rentAmount || 0;

    res.status(200).json(
      successResponse("Tenant dashboard summary fetched", {
        tenant: {
          id: tenant._id,
          name: tenant.name,
          status: tenant.status,
          propertyName: tenant.propertyId?.name || "No property assigned",
          propertyCity: tenant.propertyId?.city || "",
          roomNumber: tenant.roomId?.roomNumber || "",
          roomType: tenant.roomId?.roomType || "",
          bedNumber: tenant.bedId?.bedNumber || "",
          bedStatus: tenant.bedId?.status || "",
          rentAmount: tenant.rentAmount || 0,
        },
        rent: {
          monthlyExpectedRent: totalDue,
          monthlyCollectedRent: paid,
          pendingDues: Math.max(0, totalDue - paid),
          latestStatus: latestInvoice?.status || "unpaid",
          dueDate: latestInvoice?.dueDate || null,
          paymentLink: latestInvoice?.paymentLink || null,
        },
        complaints: { openComplaints },
        recentPayments,
      })
    );
    return;
  }

  // Build base filter
  const baseFilter = {};
  let propertyObjectId = null;
  if (propertyId) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      res.status(400);
      throw new Error("Invalid propertyId");
    }
    propertyObjectId = mongoose.Types.ObjectId.createFromHexString(propertyId);
    baseFilter.propertyId = propertyObjectId;
  }

  const totalProperties = await Property.countDocuments({ status: "active" });

  // ── Room Stats ──────────────────────────────────────────────────────────────
  const roomFilter = {
    ...baseFilter,
    status: "active",
  };
  const activeRoomIds = await Room.find(roomFilter).distinct("_id");
  const totalRooms = activeRoomIds.length;

  // ── Bed Stats ───────────────────────────────────────────────────────────────
  const bedFilter = { ...baseFilter, roomId: { $in: activeRoomIds } };
  const [totalBeds, occupiedBeds, vacantBeds, bookedBeds, maintenanceBeds] = await Promise.all([
    Bed.countDocuments(bedFilter),
    Bed.countDocuments({ ...bedFilter, status: "occupied", tenantId: { $ne: null } }),
    Bed.countDocuments({ ...bedFilter, status: "vacant" }),
    Bed.countDocuments({ ...bedFilter, status: "booked" }),
    Bed.countDocuments({ ...bedFilter, status: "maintenance" }),
  ]);

  // ── Tenant Stats ─────────────────────────────────────────────────────────────
  const activeTenants = await Tenant.countDocuments({
    ...baseFilter,
    status: "active",
  });

  // Monthly expected rent (sum of all active tenants' rentAmount)
  const rentAggregation = await Tenant.aggregate([
    { $match: { ...(propertyObjectId ? { propertyId: propertyObjectId } : {}), status: "active" } },
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
      properties: { totalProperties },
      beds: { totalBeds, occupiedBeds, vacantBeds, bookedBeds, maintenanceBeds },
      tenants: { activeTenants },
      rent: { monthlyExpectedRent, monthlyCollectedRent, pendingDues },
      complaints: { openComplaints },
      filters: { propertyId: propertyId || null, month: month || null, year: year || null },
    })
  );
});

module.exports = { getDashboardSummary };
