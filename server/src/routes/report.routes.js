const express = require("express");
const router = express.Router();
const { createReport, getReports, updateReportStatus } = require("../controllers/report.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

router
  .route("/")
  .post(protect, allowRoles("manager"), createReport)
  .get(protect, allowRoles("owner", "manager"), getReports);

router.patch("/:id/status", protect, allowRoles("owner"), updateReportStatus);

module.exports = router;
