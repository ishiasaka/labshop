/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  // ── Coverage ────────────────────────────────────────────────────────
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/__tests__/**', // exclude test files themselves
    '!app/**/*.d.ts', // exclude type declarations
    '!app/**/layout.tsx', // Next.js layout (no testable logic)
    '!app/**/page.tsx', // Next.js page entry-point (wiring only)
    '!app/**/provider.tsx', // Next.js provider wrapper (wiring only)
    '!app/locales/**', // translation loaders — no logic
    '!app/theme.ts', // MUI theme config — no branching logic
  ],
  coverageReporters: ['lcov', 'text', 'text-summary', 'json-summary'],
  coverageThreshold: {
    global: {
      // Thresholds calibrated to the current test suite (Feb 2026).
      // The fetcher() helper bodies inside usePayment/useUsers cannot be
      // exercised through SWR module mocks, so hook-level coverage is
      // intentionally lower than component-level coverage.
      // Increment each value by ~5 pp whenever new tests are added.
      statements: 90,
      branches: 78,
      functions: 90,
      lines: 92,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
