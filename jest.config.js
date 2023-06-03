module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testRegex: '\\.test\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: './coverage',
  collectCoverageFrom: ['src/**/*.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
