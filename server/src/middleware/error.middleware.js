/**
 * middleware/error.middleware.js — Global Error Handler
 *
 * Catches all errors thrown in async handlers and route controllers.
 * Returns clean JSON responses with appropriate HTTP status codes.
 *
 * Stack traces are hidden in production environment.
 *
 * Usage in app.js:
 *   app.use(notFound);   // 404 for unknown routes
 *   app.use(errorHandler); // global catch-all
 */

/**
 * 404 Not Found handler — for unmatched routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler middleware
 * Handles all errors passed via next(error) or thrown in async handlers
 */
const errorHandler = (err, req, res, next) => {
  // Determine status code
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(statusCode).json({
      success: false,
      message: "Validation failed",
      errors: messages,
    });
  }

  // Handle Mongoose duplicate key errors (e.g., unique phone)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(statusCode).json({
      success: false,
      message: `Duplicate value: ${field} already exists.`,
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    return res.status(statusCode).json({
      success: false,
      message: `Invalid ID format: ${err.value}`,
    });
  }

  // Generic error response
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
