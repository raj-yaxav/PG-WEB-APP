/**
 * utils/apiResponse.js — Consistent API Response Helpers
 *
 * Ensures all API responses follow the same format:
 *
 * Success:
 *   { success: true, message: "...", data: {...} }
 *
 * Error:
 *   { success: false, message: "..." }
 *
 * Usage:
 *   res.status(200).json(successResponse("Data fetched", data));
 *   res.status(400).json(errorResponse("Validation failed"));
 */

/**
 * Build a success response object
 * @param {string} message - Human-readable success message
 * @param {any} data - Response payload (object, array, etc.)
 * @param {object} meta - Optional metadata (pagination, counts, etc.)
 * @returns {object} Formatted success response
 */
const successResponse = (message = "Success", data = null, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return response;
};

/**
 * Build an error response object
 * @param {string} message - Human-readable error message
 * @param {any} errors - Optional detailed error info (validation errors, etc.)
 * @returns {object} Formatted error response
 */
const errorResponse = (message = "Something went wrong", errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

module.exports = { successResponse, errorResponse };
