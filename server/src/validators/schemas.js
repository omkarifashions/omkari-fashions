import { z } from 'zod';

const phone = z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number');
const password = z.string().min(8, 'Password must be at least 8 characters').max(64).regex(/[A-Za-z]/, 'Password needs a letter').regex(/\d/, 'Password needs a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone,
  password,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email') });
export const resetSchema = z.object({ password });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phone.optional(),
});

export const addressSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  phone,
  address: z.string().trim().min(5, 'Enter your full address').max(300),
  city: z.string().trim().min(2, 'City is required').max(80),
  state: z.string().trim().min(2, 'State is required').max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6 digit pincode'),
});

export const orderSchema = z.object({
  shippingAddress: addressSchema,
  paymentMethod: z.enum(['cod', 'razorpay']),
  couponCode: z.string().trim().max(30).optional().or(z.literal('')),
  idempotencyKey: z.string().trim().min(8).max(80),
  buyNowProduct: z.string().optional(),
  buyNowQty: z.coerce.number().int().min(1).max(20).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  message: z.string().trim().min(5, 'Please write a message').max(3000),
});

export const newsletterSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email') });

export const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
