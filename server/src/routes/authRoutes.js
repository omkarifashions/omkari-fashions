import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as c from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, forgotSchema, resetSchema, changePasswordSchema, profileSchema, addressSchema } from '../validators/schemas.js';

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' } });
const r = Router();

r.post('/register', limiter, validate(registerSchema), c.register);
r.post('/login', limiter, validate(loginSchema), c.login);
r.post('/logout', c.logout);
r.get('/me', protect, c.me);
r.put('/profile', protect, validate(profileSchema), c.updateProfile);
r.put('/password', protect, validate(changePasswordSchema), c.changePassword);
r.post('/addresses', protect, validate(addressSchema), c.saveAddress);
r.delete('/addresses/:id', protect, c.deleteAddress);
r.post('/forgot-password', limiter, validate(forgotSchema), c.forgotPassword);
r.post('/reset-password/:token', limiter, validate(resetSchema), c.resetPassword);

r.post('/admin/login', limiter, validate(loginSchema), c.adminLogin);
r.post('/admin/logout', c.adminLogout);
r.get('/admin/me', adminOnly, c.adminMe);
r.put('/admin/password', adminOnly, validate(changePasswordSchema), c.adminChangePassword);

export default r;
