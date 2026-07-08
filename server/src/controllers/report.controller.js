const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const ManagerReport = require("../models/ManagerReport");
const { successResponse } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

const allowedCategories = ["daily_update", "maintenance", "tenant_issue", "payment", "incident", "other"];
const allowedPriorities = ["low", "medium", "high", "urgent"];
const allowedStatuses = ["submitted", "reviewed", "closed"];

const createReport = asyncHandler(async (req, res) => {
  const { propertyId, category, title, description, priority } = req.body;

  if (req.user.role !== "manager") {
    res.status(403);
    throw new Error("Only managers can send reports to the owner");
  }

  if (!title) {
    res.status(400);
    throw new Error("Report title is required");
  }

  const normalizedCategory = category || "daily_update";
  const normalizedPriority = priority || "medium";

  if (!allowedCategories.includes(normalizedCategory)) {
    res.status(400);
    throw new Error("Please select a valid report category");
  }

  if (!allowedPriorities.includes(normalizedPriority)) {
    res.status(400);
    throw new Error("Please select a valid report priority");
  }

  if (propertyId && !mongoose.Types.ObjectId.isValid(propertyId)) {
    res.status(400);
    throw new Error("Please select a valid property");
  }

  const report = await ManagerReport.create({
    managerId: req.user._id,
    propertyId: propertyId || null,
    category: normalizedCategory,
    title: title.trim(),
    description: description || null,
    priority: normalizedPriority,
  });

  res.status(201).json(successResponse("Report sent to owner", report));
});

const getReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, category, managerId, propertyId } = req.query;

  const filter = {};

  if (req.user.role === "manager") {
    filter.managerId = req.user._id;
  } else {
    if (managerId) filter.managerId = managerId;
  }

  if (propertyId) filter.propertyId = propertyId;
  if (status) filter.status = status;
  if (category) filter.category = category;

  const [reports, total] = await Promise.all([
    ManagerReport.find(filter)
      .select("-__v")
      .populate("managerId", "name phone email loginId")
      .populate("propertyId", "name city")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ManagerReport.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse("Manager reports fetched successfully", reports, getPaginationMeta(page, limit, total))
  );
});

const updateReportStatus = asyncHandler(async (req, res) => {
  const { status, ownerNote } = req.body;

  if (!status) {
    res.status(400);
    throw new Error("Status is required");
  }

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error("Please select a valid report status");
  }

  const report = await ManagerReport.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }

  report.status = status;
  if (ownerNote !== undefined) report.ownerNote = ownerNote;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();

  await report.save();
  res.status(200).json(successResponse("Report status updated", report));
});

module.exports = { createReport, getReports, updateReportStatus };
