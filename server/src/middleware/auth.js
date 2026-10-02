import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const authenticate = (cookieName, requiredRole) =>
  asyncHandler(async (req, res, next) => {
    const token = req.cookies?.[cookieName];
    if (!token) throw new ApiError(401, 'Please log in to continue');
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (e) {
      throw new ApiError(401, e.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid session. Please log in again.');
    }
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'Account no longer exists');
    if (!user.isActive) throw new ApiError(403, 'Your account has been disabled. Please contact support.');
    if (requiredRole && user.role !== requiredRole) throw new ApiError(403, 'You do not have permission to perform this action');
    req.user = user;
    next();
  });

// Customer session (cookie: token)
export const protect = authenticate('token');
// Admin session (cookie: admin_token) - role is re-verified against the database on every request
export const adminOnly = authenticate('admin_token', 'admin');
