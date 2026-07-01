/**
 * services/roomService.js — Room & Bed API Functions
 */

import api from "./api";

// ─── Room Services ────────────────────────────────────────────────────────────
export const getRooms = (params = {}) => api.get("/rooms", { params });
export const getRoomById = (id) => api.get(`/rooms/${id}`);
export const createRoom = (data) => api.post("/rooms", data);
export const updateRoom = (id, data) => api.patch(`/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);

// ─── Bed Services ─────────────────────────────────────────────────────────────
export const getBeds = (params = {}) => api.get("/beds", { params });
export const getBedById = (id) => api.get(`/beds/${id}`);
export const createBed = (data) => api.post("/beds", data);
export const updateBed = (id, data) => api.patch(`/beds/${id}`, data);
export const updateBedStatus = (id, status) => api.patch(`/beds/${id}/status`, { status });
export const deleteBed = (id) => api.delete(`/beds/${id}`);
