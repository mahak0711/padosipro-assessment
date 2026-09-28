import { prisma } from '../prisma';
import { env } from '../config/env';
import { generateOtp, hashOtp, compareOtp, otpExpiryDate, isExpired } from '../utils/otp';
import { sendOtpEmail } from './email';
import { ApiError } from '../middleware/errorHandler';

const PURPOSE_VERIFY_EMAIL = 'verify_email';

export class OtpCooldownError extends ApiError {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super(429, 'OTP_COOLDOWN', `Please wait ${retryAfterSeconds}s before requesting another code`);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Issues a fresh OTP for the user, enforcing the resend cooldown, and emails it. */
export async function issueOtp(userId: string, email: string, purpose: string = PURPOSE_VERIFY_EMAIL) {
  const lastOtp = await prisma.otpCode.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: 'desc' },
  });

  if (lastOtp) {
    const elapsedMs = Date.now() - lastOtp.createdAt.getTime();
    const cooldownMs = env.otpResendCooldownSeconds * 1000;
    if (elapsedMs < cooldownMs) {
      throw new OtpCooldownError(Math.ceil((cooldownMs - elapsedMs) / 1000));
    }
  }

  const code = generateOtp();
  const codeHash = await hashOtp(code);

  await prisma.otpCode.create({
    data: {
      userId,
      purpose,
      codeHash,
      expiresAt: otpExpiryDate(),
      maxAttempts: env.otpMaxAttempts,
    },
  });

  await sendOtpEmail(email, code);
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'NOT_FOUND' | 'EXPIRED' | 'LOCKED' | 'INCORRECT'; attemptsRemaining?: number };

/** Verifies a submitted code against the latest unconsumed OTP for the user. */
export async function verifyOtp(userId: string, code: string, purpose: string = PURPOSE_VERIFY_EMAIL): Promise<OtpVerifyResult> {
  const otp = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  if (isExpired(otp.expiresAt)) {
    return { ok: false, reason: 'EXPIRED' };
  }

  if (otp.attempts >= otp.maxAttempts) {
    return { ok: false, reason: 'LOCKED' };
  }

  const matches = await compareOtp(code, otp.codeHash);

  if (!matches) {
    const updated = await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: 'INCORRECT', attemptsRemaining: Math.max(0, updated.maxAttempts - updated.attempts) };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true };
}

export { PURPOSE_VERIFY_EMAIL };
