import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const signToken = (id, role) => jwt.sign({ id, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

export const setAuthCookie = (res, name, token) => res.cookie(name, token, cookieOptions());
export const clearAuthCookie = (res, name) => res.clearCookie(name, { ...cookieOptions(), maxAge: undefined });
