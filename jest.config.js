module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/client/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '<rootDir>/client/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/client/**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'client/**/*.(ts|tsx)',
    '!client/**/*.d.ts',
    '!client/main.tsx',
    '!client/vite-env.d.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
