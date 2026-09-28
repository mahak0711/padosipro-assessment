/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/env.setup.ts'],
  globalSetup: '<rootDir>/tests/global.setup.ts',
  globalTeardown: '<rootDir>/tests/global.teardown.ts',
  testTimeout: 15000,
};
