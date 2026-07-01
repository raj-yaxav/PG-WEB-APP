/**
 * services/complaintService.js — Complaint API Functions
 */

import api from "./api";

export const getComplaints = (params = {}) => api.get("/complaints", { params });
export const getComplaintById = (id) => api.get(`/complaints/${id}`);
export const createComplaint = (data) => api.post("/complaints", data);
export const deleteComplaint = (id) => api.delete(`/complaints/${id}`);

/**
 * Update complaint status and admin note
 * @param {string} id - Complaint ID
 * @param {string} status - "pending" | "in_progress" | "resolved"
 * @param {string} adminNote - Admin's note/response
 */
export const updateComplaintStatus = (id, status, adminNote = "") =>
  api.patch(`/complaints/${id}/status`, { status, adminNote });
