import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: required('DATABASE_URL', 'file:./dev.db'),
  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',

  otpLength: parseInt(process.env.OTP_LENGTH ?? '6', 10),
  otpTtlMinutes: parseInt(process.env.OTP_TTL_MINUTES ?? '10', 10),
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
  otpResendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? '30', 10),

  emailMode: (process.env.EMAIL_MODE ?? 'ethereal') as 'ethereal' | 'smtp' | 'test',
  smtpHost: process.env.SMTP_HOST ?? 'localhost',
  smtpPort: parseInt(process.env.SMTP_PORT ?? '1025', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'PadosiPro <no-reply@padosipro.local>',
};
