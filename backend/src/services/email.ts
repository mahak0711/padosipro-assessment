import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

let transporterPromise: Promise<Transporter> | null = null;

async function buildTransporter(): Promise<Transporter> {
  if (env.emailMode === 'smtp') {
    return nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    });
  }

  // Ethereal: creates a disposable, free test inbox on the fly. Nothing is
  // really delivered; every send() result includes a preview URL we log,
  // which is handy for grading without needing any real SMTP credentials.
  const testAccount = await nodemailer.createTestAccount();
  console.log(`[email] Using Ethereal test inbox: ${testAccount.user}`);
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = buildTransporter();
  }
  return transporterPromise;
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  // 'test' mode avoids any network call so the automated test suite (and CI)
  // never depends on reaching the real Ethereal service.
  if (env.emailMode === 'test') {
    console.log(`[email:test] OTP for ${to}: ${code}`);
    return;
  }

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject: 'Your PadosiPro verification code',
    text: `Your verification code is ${code}. It expires in ${env.otpTtlMinutes} minutes.`,
    html: `<p>Your verification code is <b>${code}</b>.</p><p>It expires in ${env.otpTtlMinutes} minutes.</p>`,
  });

  if (env.emailMode === 'ethereal') {
    // Ethereal never delivers anywhere real, so whoever is running this
    // backend locally IS the only "inbox" there is. Print the code directly
    // rather than making them click through to a preview page to read it —
    // this is local/dev-only output, never used for the 'smtp' mode (which
    // may point at a real provider).
    console.log('');
    console.log(`[email] ---- OTP for ${to}: ${code} ----`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[email] (full email preview, optional: ${previewUrl})`);
    }
    console.log('');
  }
}
