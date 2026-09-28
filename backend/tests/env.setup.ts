import path from 'path';

// Prisma resolves relative sqlite `file:` URLs relative to schema.prisma's
// directory (prisma/), not the process cwd — use an absolute path so this
// setup file, global.setup.ts and global.teardown.ts all agree on one file.
const TEST_DB_PATH = path.join(__dirname, 'test.db');

process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.EMAIL_MODE = 'test';
process.env.OTP_LENGTH = '6';
process.env.OTP_TTL_MINUTES = '10';
process.env.OTP_MAX_ATTEMPTS = '5';
process.env.OTP_RESEND_COOLDOWN_SECONDS = '30';
