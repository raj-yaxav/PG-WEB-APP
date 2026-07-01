/**
 * utils/generateToken.js — JWT Token Generator
 *
 * Generates a signed JWT token with user ID and role as payload.
 * Uses JWT_SECRET and JWT_EXPIRES_IN from environment variables.
 *
 * Usage:
 *   const token = generateToken(user._id, user.role);
 */

const jwt = require("jsonwebtoken");

/**
 * Generate a JWT token for a user
 * @param {string|ObjectId} userId - MongoDB user ID
 * @param {string} role - User role: "owner" | "manager" | "tenant"
 * @returns {string} Signed JWT token
 */
const generateToken = (userId, role) => {
  const payload = {
    id: userId,
    role: role,
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

module.exports = generateToken;
