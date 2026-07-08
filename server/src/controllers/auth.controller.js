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
        profilePhotoUrl: user.profilePhotoUrl,
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
  const startedAt = Date.now();

  if (!loginValue || !password) {
    console.warn("[auth.login] missing credentials", {
      role,
      hasLoginValue: Boolean(loginValue),
      hasPassword: Boolean(password),
    });
    res.status(400);
    throw new Error("Login ID/email and password are required");
  }

  const normalizedRole =
    role && ["owner", "manager", "tenant"].includes(role) ? role : null;
  const lookup =
    normalizedRole === "owner" || loginValue.includes("@")
      ? { email: loginValue.toLowerCase() }
      : { loginId: loginValue.toUpperCase() };

  console.log("[auth.login] attempt", {
    role: normalizedRole || "unspecified",
    lookupType: lookup.email ? "email" : "loginId",
    loginValue: lookup.email || lookup.loginId,
  });

  const user = await User.findOne(lookup);

  if (!user) {
    console.warn("[auth.login] user not found", {
      lookupType: lookup.email ? "email" : "loginId",
      loginValue: lookup.email || lookup.loginId,
      durationMs: Date.now() - startedAt,
    });
    res.status(401);
    throw new Error("Invalid login details");
  }

  if (normalizedRole && user.role !== normalizedRole) {
    console.warn("[auth.login] role mismatch", {
      requestedRole: normalizedRole,
      actualRole: user.role,
      userId: user._id.toString(),
    });
    res.status(403);
    throw new Error(`This account is not registered as ${normalizedRole}`);
  }

  // Check if account is active
  if (user.status !== "active") {
    console.warn("[auth.login] inactive account", {
      userId: user._id.toString(),
      role: user.role,
      status: user.status,
    });
    res.status(403);
    throw new Error("Your account is inactive. Please contact support.");
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    console.warn("[auth.login] password mismatch", {
      userId: user._id.toString(),
      role: user.role,
      durationMs: Date.now() - startedAt,
    });
    res.status(401);
    throw new Error("Invalid login details");
  }

  // Generate token
  const token = generateToken(user._id, user.role);

  console.log("[auth.login] success", {
    userId: user._id.toString(),
    role: user.role,
    durationMs: Date.now() - startedAt,
  });

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
        profilePhotoUrl: user.profilePhotoUrl,
      },
    })
  );
});

/**
 * @desc    Create a manager account
 * @route   POST /api/auth/managers
 * @access  Protected (owner)
 */
const createManager = asyncHandler(async (req, res) => {
  const { name, email, phone, password, loginId } = req.body;

  if (!name || !password) {
    res.status(400);
    throw new Error("Manager name and password are required");
  }

  const managerLoginId =
    (loginId && loginId.trim().toUpperCase()) ||
    `MGR-${Math.floor(1000 + Math.random() * 9000)}`;

  const existingManager = await User.findOne({ loginId: managerLoginId });
  if (existingManager) {
    res.status(409);
    throw new Error("Manager ID already exists");
  }

  if (email) {
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      res.status(409);
      throw new Error("User with this email already exists");
    }
  }

  const manager = await User.create({
    name,
    email: email || undefined,
    phone: phone || undefined,
    loginId: managerLoginId,
    password,
    role: "manager",
    status: "active",
  });

  res.status(201).json(
    successResponse("Manager created successfully", {
      user: {
        _id: manager._id,
        name: manager.name,
        phone: manager.phone,
        email: manager.email,
        loginId: manager.loginId,
        role: manager.role,
        status: manager.status,
        profilePhotoUrl: manager.profilePhotoUrl,
      },
    })
  );
});

/**
 * @desc    List manager accounts
 * @route   GET /api/auth/managers
 * @access  Protected (owner)
 */
const getManagers = asyncHandler(async (req, res) => {
  const managers = await User.find({ role: "manager" })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(successResponse("Managers fetched", managers));
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
      profilePhotoUrl: user.profilePhotoUrl,
      createdAt: user.createdAt,
    })
  );
});

/**
 * @desc    Update current user profile
 * @route   PATCH /api/auth/me
 * @access  Protected (any role)
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, email, profilePhotoUrl } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (email && email.toLowerCase() !== user.email) {
    const existingEmail = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: user._id },
    });
    if (existingEmail) {
      res.status(409);
      throw new Error("User with this email already exists");
    }
  }

  if (phone && phone !== user.phone) {
    const existingPhone = await User.findOne({
      phone,
      _id: { $ne: user._id },
    });
    if (existingPhone) {
      res.status(409);
      throw new Error("User with this phone already exists");
    }
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone || undefined;
  if (email !== undefined) user.email = email || undefined;
  if (profilePhotoUrl !== undefined) user.profilePhotoUrl = profilePhotoUrl || null;

  await user.save();

  res.status(200).json(
    successResponse("Profile updated successfully", {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      loginId: user.loginId,
      role: user.role,
      status: user.status,
      profilePhotoUrl: user.profilePhotoUrl,
      createdAt: user.createdAt,
    })
  );
});

/**
 * @desc    Change current user password
 * @route   PATCH /api/auth/change-password
 * @access  Protected (any role)
 */
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Old password and new password are required");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error("Old password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json(successResponse("Password changed successfully", null));
});

/**
 * @desc    Verify current user password (for sensitive actions)
 * @route   POST /api/auth/verify-password
 * @access  Protected (any role)
 */
const verifyPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error("Password is required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Password is incorrect");
  }

  res.status(200).json(successResponse("Password verified", null));
});

/**
 * @desc    Delete a manager account
 * @route   DELETE /api/auth/managers/:id
 * @access  Protected (owner)
 */
const deleteManager = asyncHandler(async (req, res) => {
  const manager = await User.findOneAndDelete({
    _id: req.params.id,
    role: "manager",
  });

  if (!manager) {
    res.status(404);
    throw new Error("Manager not found");
  }

  res.status(200).json(successResponse("Manager deleted successfully"));
});

module.exports = { register, login, getMe, updateMe, changePassword, verifyPassword, createManager, getManagers, deleteManager };
