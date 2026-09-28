import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/** Generates a zero-padded numeric OTP of the configured length using a CSPRNG. */
export function generateOtp(length: number = env.otpLength): string {
  const max = 10 ** length;
  const value = crypto.randomInt(0, max);
  return value.toString().padStart(length, '0');
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function compareOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function otpExpiryDate(minutes: number = env.otpTtlMinutes): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime();
}
