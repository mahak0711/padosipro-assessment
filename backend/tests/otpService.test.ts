import { prisma } from '../src/prisma';
import { issueOtp, verifyOtp, OtpCooldownError } from '../src/services/otpService';

async function makeUser(email: string) {
  return prisma.user.create({ data: { email, passwordHash: 'irrelevant-for-otp-tests' } });
}

describe('otpService', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects verification when no OTP has been issued', async () => {
    const user = await makeUser('no-otp@example.com');
    const result = await verifyOtp(user.id, '123456');
    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });

  it('enforces the resend cooldown between two issues', async () => {
    const user = await makeUser('cooldown@example.com');
    await issueOtp(user.id, user.email);
    await expect(issueOtp(user.id, user.email)).rejects.toBeInstanceOf(OtpCooldownError);
  });

  it('locks out verification after exceeding the max attempts', async () => {
    const user = await makeUser('lockout@example.com');
    await issueOtp(user.id, user.email);

    for (let i = 0; i < 5; i++) {
      const result = await verifyOtp(user.id, '000000'); // deliberately wrong
      expect(result.ok).toBe(false);
      if (result.ok === false) expect(result.reason).toBe('INCORRECT');
    }

    const locked = await verifyOtp(user.id, '000000');
    expect(locked).toEqual({ ok: false, reason: 'LOCKED' });
  });

  it('rejects a verify attempt once the OTP has expired', async () => {
    const user = await makeUser('expired@example.com');
    await issueOtp(user.id, user.email);

    const otp = await prisma.otpCode.findFirstOrThrow({ where: { userId: user.id } });
    await prisma.otpCode.update({ where: { id: otp.id }, data: { expiresAt: new Date(Date.now() - 1000) } });

    const result = await verifyOtp(user.id, '000000');
    expect(result).toEqual({ ok: false, reason: 'EXPIRED' });
  });

  it('does not allow reusing an already-consumed OTP', async () => {
    const user = await makeUser('reuse@example.com');
    await issueOtp(user.id, user.email);

    const otp = await prisma.otpCode.findFirstOrThrow({ where: { userId: user.id } });
    // Force-set a known code hash so we can verify it once, then try again.
    const { hashOtp } = await import('../src/utils/otp');
    await prisma.otpCode.update({ where: { id: otp.id }, data: { codeHash: await hashOtp('999999') } });

    const first = await verifyOtp(user.id, '999999');
    expect(first).toEqual({ ok: true });

    const second = await verifyOtp(user.id, '999999');
    expect(second).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });
});
