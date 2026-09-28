import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { validateBody } from '../middleware/validate';
import { registerSchema, emailOnlySchema, verifyOtpSchema, loginSchema } from '../utils/validators';
import { issueOtp, verifyOtp, OtpCooldownError } from '../services/otpService';
import { signToken } from '../utils/jwt';
import { ApiError, errorHandler } from '../middleware/errorHandler';

const router = Router();

function asyncHandler(fn: (...args: any[]) => Promise<any>) {
  return (req: any, res: any, next: any) => fn(req, res, next).catch(next);
}

router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.isVerified) {
        throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists. Try logging in.');
      }
      // Re-registering an unverified account: refresh password and resend OTP.
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
      await issueOtp(existing.id, existing.email);
      return res.status(200).json({ message: 'Account already pending verification. A new code has been sent.', email: existing.email });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    await issueOtp(user.id, user.email);

    res.status(201).json({ message: 'Registered. Check your email for a verification code.', email: user.email });
  })
);

router.post(
  '/resend-otp',
  validateBody(emailOnlySchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'No account found with this email');
    }
    if (user.isVerified) {
      throw new ApiError(409, 'ALREADY_VERIFIED', 'This account is already verified. Please log in.');
    }
    await issueOtp(user.id, user.email);
    res.status(200).json({ message: 'A new verification code has been sent.' });
  })
);

router.post(
  '/verify-otp',
  validateBody(verifyOtpSchema),
  asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'No account found with this email');
    }
    if (user.isVerified) {
      return res.status(200).json({ message: 'Account already verified.' });
    }

    const result = await verifyOtp(user.id, code);

    if (!result.ok) {
      const messages: Record<string, string> = {
        NOT_FOUND: 'No active code found. Please request a new one.',
        EXPIRED: 'This code has expired. Please request a new one.',
        LOCKED: 'Too many incorrect attempts. Please request a new code.',
        INCORRECT: `Incorrect code. ${result.attemptsRemaining ?? 0} attempt(s) remaining.`,
      };
      throw new ApiError(400, `OTP_${result.reason}`, messages[result.reason]);
    }

    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  })
);

router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
    }

    if (!user.isVerified) {
      throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email before logging in');
    }

    const token = signToken({ userId: user.id, email: user.email });
    const profileComplete = Boolean(user.name && user.mobileNumber && user.address);

    res.status(200).json({
      token,
      user: { id: user.id, email: user.email, profileComplete },
    });
  })
);

export default router;
