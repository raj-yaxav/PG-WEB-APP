// @ts-nocheck
/**
 * services/dashboardService.js — Dashboard API Functions
 */

import api from "./api";

/**
 * Get dashboard summary stats
 * @param {object} params - { propertyId, month, year }
 * @returns {Promise} Dashboard stats object
 */
export const getDashboardSummary = (params = {}) =>
  api.get("/dashboard/summary", { params });

