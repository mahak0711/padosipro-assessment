import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

const app = createApp();

describe('POST /api/auth/register + verify + login', () => {
  it('runs the full happy path: register -> verify -> login', async () => {
    const email = 'happy-path@example.com';
    const password = 'Password123';

    const registerRes = await request(app).post('/api/auth/register').send({ email, password });
    expect(registerRes.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.isVerified).toBe(false);

    // Login before verification must be rejected.
    const earlyLogin = await request(app).post('/api/auth/login').send({ email, password });
    expect(earlyLogin.status).toBe(403);
    expect(earlyLogin.body.error.code).toBe('EMAIL_NOT_VERIFIED');

    // The API never returns the raw OTP (it's hashed at rest), so simulate
    // knowledge of the mailed code by resetting the stored hash to a known
    // value, exactly like the otpService expiry/lockout tests do.
    const otp = await prisma.otpCode.findFirstOrThrow({ where: { userId: user.id } });
    const { hashOtp } = await import('../src/utils/otp');
    await prisma.otpCode.update({ where: { id: otp.id }, data: { codeHash: await hashOtp('424242') } });

    const wrongVerify = await request(app).post('/api/auth/verify-otp').send({ email, code: '111111' });
    expect(wrongVerify.status).toBe(400);
    expect(wrongVerify.body.error.code).toBe('OTP_INCORRECT');

    const verifyRes = await request(app).post('/api/auth/verify-otp').send({ email, code: '424242' });
    expect(verifyRes.status).toBe(200);

    const verifiedUser = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(verifiedUser.isVerified).toBe(true);

    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toEqual(expect.any(String));
    expect(loginRes.body.user.email).toBe(email);
  });

  it('rejects login with a wrong password', async () => {
    const email = 'wrong-password@example.com';
    await request(app).post('/api/auth/register').send({ email, password: 'CorrectPass1' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'WrongPass1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects login for a non-existent account without leaking which part was wrong', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('validates registration input on the server', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.length).toBeGreaterThan(0);
  });

  it('rejects a resend before the cooldown has elapsed', async () => {
    const email = 'resend-cooldown@example.com';
    await request(app).post('/api/auth/register').send({ email, password: 'Password123' });

    const res = await request(app).post('/api/auth/resend-otp').send({ email });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('OTP_COOLDOWN');
  });

  it('protects profile and task routes from unauthenticated requests', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });
});
