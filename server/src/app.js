/**
 * app.js — Express Application Configuration
 *
 * This file configures the Express application:
 * - Middleware setup (cors, json parsing)
 * - Route mounting
 * - 404 handler
 * - Global error handler
 *
 * server.js only imports this and starts listening.
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import route files
const authRoutes = require("./routes/auth.routes");
const propertyRoutes = require("./routes/property.routes");
const roomRoutes = require("./routes/room.routes");
const bedRoutes = require("./routes/bed.routes");
const tenantRoutes = require("./routes/tenant.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const paymentRoutes = require("./routes/payment.routes");
const complaintRoutes = require("./routes/complaint.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const uploadRoutes = require("./routes/upload.routes");

// Import error middleware
const { errorHandler, notFound } = require("./middleware/error.middleware");

const app = express();

// ─── Core Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check Route ──────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PG Management API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/uploads", uploadRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
