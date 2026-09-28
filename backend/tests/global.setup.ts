import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, 'test.db');

module.exports = async () => {
  for (const file of [TEST_DB_PATH, `${TEST_DB_PATH}-journal`]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  execSync('npx prisma db push --skip-generate', {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
    stdio: 'inherit',
  });
};
