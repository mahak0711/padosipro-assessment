import { generateOtp, hashOtp, compareOtp, otpExpiryDate, isExpired } from '../src/utils/otp';

describe('OTP generation', () => {
  it('produces a 6-digit numeric string by default', () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('zero-pads short random values to the requested length', () => {
    // Run many times to make it overwhelmingly likely we hit a low value at least once.
    const codes = Array.from({ length: 200 }, () => generateOtp(6));
    expect(codes.every((c) => c.length === 6)).toBe(true);
  });

  it('supports custom lengths', () => {
    const code = generateOtp(4);
    expect(code).toMatch(/^\d{4}$/);
  });

  it('has reasonable spread across many generations (not constant)', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateOtp()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('OTP hashing', () => {
  it('hashes the code so the raw value is not stored', async () => {
    const code = '123456';
    const hash = await hashOtp(code);
    expect(hash).not.toEqual(code);
  });

  it('correctly verifies a matching code', async () => {
    const code = '654321';
    const hash = await hashOtp(code);
    await expect(compareOtp(code, hash)).resolves.toBe(true);
  });

  it('rejects a non-matching code', async () => {
    const hash = await hashOtp('111111');
    await expect(compareOtp('222222', hash)).resolves.toBe(false);
  });
});

describe('OTP expiry', () => {
  it('sets an expiry roughly N minutes in the future', () => {
    const before = Date.now();
    const expiry = otpExpiryDate(10);
    const diffMinutes = (expiry.getTime() - before) / 60000;
    expect(diffMinutes).toBeGreaterThan(9.9);
    expect(diffMinutes).toBeLessThanOrEqual(10.1);
  });

  it('treats a past timestamp as expired', () => {
    const past = new Date(Date.now() - 1000);
    expect(isExpired(past)).toBe(true);
  });

  it('treats a future timestamp as not expired', () => {
    const future = new Date(Date.now() + 60000);
    expect(isExpired(future)).toBe(false);
  });

  it('treats the exact expiry instant as expired (boundary)', () => {
    const now = new Date();
    expect(isExpired(now, now)).toBe(true);
  });
});
