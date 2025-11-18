module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'lib/agent-architecture/agents/**/*.ts',
    '!lib/agent-architecture/agents/**/*.test.ts',
  ],
};
