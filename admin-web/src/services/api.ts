// @ts-nocheck
/**
 * services/api.js — Axios Instance & Base Configuration
 *
 * - Base URL read from NEXT_PUBLIC_API_URL environment variable
 * - Attaches JWT token from localStorage to every request
 * - Handles 401 unauthorized responses (redirect to login)
 */

import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor: Attach JWT Token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Read token from localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("pg_token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle Errors ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized — clear token and redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pg_token");
        localStorage.removeItem("pg_user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

