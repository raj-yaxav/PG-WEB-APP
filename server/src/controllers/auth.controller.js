/**
 * controllers/auth.controller.js — Authentication Controller
 *
 * Handles:
 *   POST /api/auth/register  — Register a new user
 *   POST /api/auth/login     — Login with owner email or assigned ID + password
 *   GET  /api/auth/me        — Get current logged-in user (protected)
 */

const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { successResponse, errorResponse } = require("../utils/apiResponse");

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required for owner signup");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409);
    throw new Error("User with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    phone: phone || undefined,
    password,
    role: "owner",
  });

  // Generate token
  const token = generateToken(user._id, user.role);

  res.status(201).json(
    successResponse("Registration successful", {
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        loginId: user.loginId,
        role: user.role,
        status: user.status,
      },
    })
  );
});

/**
 * @desc    Login user with owner email or assigned manager/tenant ID
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, loginId, identifier, password, role } = req.body;
  const loginValue = (email || loginId || identifier || "").trim();

  if (!loginValue || !password) {
    res.status(400);
    throw new Error("Login ID/email and password are required");
  }

  const normalizedRole =
    role && ["owner", "manager", "tenant"].includes(role) ? role : null;
  const lookup =
    normalizedRole === "owner" || loginValue.includes("@")
      ? { email: loginValue.toLowerCase() }
      : { loginId: loginValue.toUpperCase() };

  const user = await User.findOne(lookup);

  if (!user) {
    res.status(401);
    throw new Error("Invalid login details");
  }

  if (normalizedRole && user.role !== normalizedRole) {
    res.status(403);
    throw new Error(`This account is not registered as ${normalizedRole}`);
  }

  // Check if account is active
  if (user.status !== "active") {
    res.status(403);
    throw new Error("Your account is inactive. Please contact support.");
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid login details");
  }

  // Generate token
  const token = generateToken(user._id, user.role);

  res.status(200).json(
    successResponse("Login successful", {
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        loginId: user.loginId,
        role: user.role,
        status: user.status,
      },
    })
  );
});

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Protected (any role)
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by protect middleware
  const user = req.user;

  res.status(200).json(
    successResponse("User profile fetched", {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      loginId: user.loginId,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    })
  );
});

module.exports = { register, login, getMe };
