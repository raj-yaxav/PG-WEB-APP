// @ts-nocheck
/**
 * services/invoiceService.js — Invoice & Payment API Functions
 */

import api from "./api";

// ─── Invoice Services ─────────────────────────────────────────────────────────
export const getInvoices = (params = {}) => api.get("/invoices", { params });
export const getInvoiceById = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post("/invoices", data);
export const updateInvoice = (id, data) => api.patch(`/invoices/${id}`, data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);
export const markInvoicePaid = (id) => api.patch(`/invoices/${id}/mark-paid`);

// ─── Payment Services ─────────────────────────────────────────────────────────
export const getPayments = (params = {}) => api.get("/payments", { params });
export const getPaymentById = (id) => api.get(`/payments/${id}`);
export const createPayment = (data) => api.post("/payments", data);
export const deletePayment = (id) => api.delete(`/payments/${id}`);

