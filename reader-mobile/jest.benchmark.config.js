/**
 * Config for the offline library-scan cost benchmark (Wayfinder WF-0011).
 * Kept separate from `jest.config.js` so `npm test` stays a behavioural suite;
 * the benchmark is an evidence harness that prints operation counts.
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/benchmarks/**/*.bench.ts'],
  clearMocks: true,
  testTimeout: 300000,
};
