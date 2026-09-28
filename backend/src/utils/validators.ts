import { z } from 'zod';

// India-only mobile numbers: optional +91 prefix, then exactly 10 digits starting 6-9.
export const indianMobileRegex = /^(?:\+91)?[6-9]\d{9}$/;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .regex(/[A-Za-z]/, 'Password must include at least one letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
});

export const emailOnlySchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  mobileNumber: z
    .string()
    .trim()
    .regex(indianMobileRegex, 'Enter a valid 10-digit Indian mobile number, optionally prefixed with +91'),
  address: z.string().trim().min(5, 'Address must be at least 5 characters').max(500),
  businessName: z.string().trim().max(150).optional().or(z.literal('')),
});

export const taskSelectionSchema = z.object({
  taskIds: z.array(z.string().uuid('Invalid task id')).min(1, 'Select at least one task'),
});
