const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const adminCredentialsSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters long'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().optional().nullable(),
});

const otpRequestSchema = z.object({
  identifier: z.string().trim().min(3, 'Email or phone number required'),
});

const otpVerifySchema = z.object({
  identifier: z.string().trim().min(3, 'Email or phone number required'),
  code: z.string().trim().length(6, 'OTP code must be 6 digits'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Valid reset token required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

module.exports = {
  loginSchema,
  adminCredentialsSchema,
  registerSchema,
  otpRequestSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
