// @ts-nocheck
/**
 * services/tenantService.js — Tenant API Functions
 */

import api from "./api";

export const getTenants = (params = {}) => api.get("/tenants", { params });
export const getTenantById = (id) => api.get(`/tenants/${id}`);
export const createTenant = (data) => api.post("/tenants", data);
export const updateTenant = (id, data) => api.patch(`/tenants/${id}`, data);
export const deleteTenant = (id) => api.delete(`/tenants/${id}`);

/**
 * Assign a bed to a tenant
 * @param {string} tenantId
 * @param {string} bedId
 */
export const assignBed = (tenantId, bedId) =>
  api.patch(`/tenants/${tenantId}/assign-bed`, { bedId });

/**
 * Mark a tenant as left (frees their bed)
 * @param {string} tenantId
 */
export const markTenantLeft = (tenantId) =>
  api.patch(`/tenants/${tenantId}/mark-left`);

