/**
 * middleware/role.middleware.js — Role-Based Access Control Middleware
 *
 * Restricts access to routes based on user role.
 * Must be used AFTER the protect middleware (requires req.user).
 *
 * Supported Roles:
 *   - "owner"   → PG owner with full access
 *   - "manager" → Property manager with limited admin access
 *   - "tenant"  → Tenant with read-only and self-service access
 *
 * Usage:
 *   router.post("/", protect, allowRoles("owner", "manager"), createProperty);
 *   router.get("/me", protect, allowRoles("tenant"), getMyProfile);
 */

/**
 * allowRoles — Middleware factory for role-based access control
 * @param {...string} roles - Allowed roles (e.g., "owner", "manager", "tenant")
 * @returns {Function} Express middleware
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of the following roles: ${roles.join(", ")}.`,
      });
    }

    next();
  };
};

module.exports = { allowRoles };
