// jest.config.mjs

export default {
  // Recommended for native ES6 use (Aug-20):
  testEnvironment: 'jest-environment-node',
  transform: {},

  // Default is 5000. None of our tests take that long; fail fast.
  testTimeout: 2000,

  // Load docs, once at the beginning of the tests.
  globalSetup: "./setup.jest.cjs"
};