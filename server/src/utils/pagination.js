/**
 * utils/pagination.js — Pagination Helper
 *
 * Provides consistent pagination logic for list APIs.
 *
 * Usage:
 *   const { page, limit, skip } = getPagination(req.query);
 *   const data = await Model.find(filter).skip(skip).limit(limit).lean();
 *   const total = await Model.countDocuments(filter);
 *   return res.json(successResponse("Data fetched", data, getPaginationMeta(page, limit, total)));
 */

/**
 * Extract and normalize pagination params from query string
 * @param {object} query - req.query object
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build pagination metadata for the response
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of documents
 * @returns {object} Pagination metadata
 */
const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { getPagination, getPaginationMeta };
