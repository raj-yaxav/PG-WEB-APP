/**
 * middleware/auth.middleware.js — JWT Authentication Middleware
 *
 * Reads JWT token from the Authorization header (Bearer <token>).
 * Verifies the token using JWT_SECRET from environment.
 * Attaches decoded user payload to req.user for downstream use.
 *
 * Usage:
 *   router.get("/me", protect, (req, res) => { ... });
 */

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Protect middleware — verifies JWT and attaches req.user
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized. No token provided.");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).select("-password").lean();

    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized. User not found.");
    }

    if (req.user.status !== "active") {
      res.status(403);
      throw new Error("Account is inactive. Please contact support.");
    }

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      res.status(401);
      throw new Error("Not authorized. Invalid token.");
    }
    if (error.name === "TokenExpiredError") {
      res.status(401);
      throw new Error("Not authorized. Token expired.");
    }
    throw error;
  }
});

module.exports = { protect };
