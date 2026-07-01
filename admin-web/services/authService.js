/**
 * services/authService.js — Auth API Functions
 *
 * Handles login, register, and current user fetch.
 * Token is stored in localStorage after login.
 */

import api from "./api";

/**
 * Login with owner email or assigned account ID and password
 * @param {object} credentials - { role, identifier, password }
 * Owner uses email. Manager/tenant use loginId.
 * @returns {Promise} { token, user }
 */
export const login = ({ role, identifier, password }) => {
  const payload =
    role === "owner"
      ? { role, email: identifier, password }
      : { role, loginId: identifier, password };

  return api.post("/auth/login", payload);
};

/**
 * Register owner account
 * @param {object} userData - { name, email, password, phone }
 * @param {string} password
 * @returns {Promise} { token, user }
 */
export const register = (userData) =>
  api.post("/auth/register", userData);

/**
 * Get current logged-in user profile
 * @returns {Promise} { user }
 */
export const getMe = () => api.get("/auth/me");

/**
 * Helper: Save auth data to localStorage
 * @param {string} token
 * @param {object} user
 */
export const saveAuthData = (token, user) => {
  localStorage.setItem("pg_token", token);
  localStorage.setItem("pg_user", JSON.stringify(user));
};

/**
 * Helper: Clear auth data from localStorage (logout)
 */
export const clearAuthData = () => {
  localStorage.removeItem("pg_token");
  localStorage.removeItem("pg_user");
};

/**
 * Helper: Get stored user from localStorage
 * @returns {object|null}
 */
export const getStoredUser = () => {
  const user = localStorage.getItem("pg_user");
  return user ? JSON.parse(user) : null;
};
