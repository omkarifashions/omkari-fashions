import crypto from "crypto";
import User from "../models/User.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/token.js";
import { mail } from "../services/emailService.js";
import Cart from "../models/Cart.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (await User.exists({ email }))
    throw new ApiError(409, "An account with this email already exists");
  const user = await User.create({ name, email, phone, password });
  setAuthCookie(res, "token", signToken(user._id, user.role));
  mail.welcome(user);
  res.status(201).json({ success: true, user: user.toSafe() });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find account by email, regardless of role
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "Your account has been disabled. Please contact support.",
    );
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  // Admin gets the separate admin session
  if (user.role === "admin") {
    setAuthCookie(res, "admin_token", signToken(user._id, user.role));
  } else {
    // Customer gets the normal customer session
    setAuthCookie(res, "token", signToken(user._id, user.role));
  }

  res.json({
    success: true,
    user: user.toSafe(),
  });
});

export const logout = (req, res) => {
  clearAuthCookie(res, "token");
  res.json({ success: true });
};

export const me = (req, res) =>
  res.json({ success: true, user: req.user.toSafe() });

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name) req.user.name = name;
  if (phone) req.user.phone = phone;
  await req.user.save();
  res.json({ success: true, user: req.user.toSafe() });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(req.body.currentPassword)))
    throw new ApiError(400, "Current password is incorrect");
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated" });
});

export const saveAddress = asyncHandler(async (req, res) => {
  const addr = { ...req.body };
  const user = req.user;
  if (user.addresses.length === 0) addr.isDefault = true;
  user.addresses.push(addr);
  if (user.addresses.length > 10)
    throw new ApiError(400, "You can save up to 10 addresses");
  await user.save();
  res.status(201).json({ success: true, user: user.toSafe() });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  req.user.addresses.pull({ _id: req.params.id });
  await req.user.save();
  res.json({ success: true, user: req.user.toSafe() });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, role: "customer" });
  if (user) {
    const raw = user.createResetToken();
    await user.save({ validateBeforeSave: false });
    await mail.passwordReset(user, `${env.clientUrl}/reset-password/${raw}`);
  }
  res.json({
    success: true,
    message: "If an account exists for this email, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");
  if (!user)
    throw new ApiError(400, "This reset link is invalid or has expired");
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.json({
    success: true,
    message: "Password reset successful. Please log in.",
  });
});

// ---------------- Admin session (separate cookie) ----------------
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: "admin" }).select("+password");
  if (!user || !(await user.matchPassword(password)))
    throw new ApiError(401, "Invalid admin credentials");
  if (!user.isActive) throw new ApiError(403, "Account disabled");
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  setAuthCookie(res, "admin_token", signToken(user._id, user.role));
  res.json({ success: true, user: user.toSafe() });
});

export const adminLogout = (req, res) => {
  clearAuthCookie(res, "admin_token");
  res.json({ success: true });
};

export const adminMe = (req, res) =>
  res.json({ success: true, user: req.user.toSafe() });

export const adminChangePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(req.body.currentPassword)))
    throw new ApiError(400, "Current password is incorrect");
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated" });
});

export const removeCartOnDelete = async (userId) =>
  Cart.deleteOne({ user: userId });
