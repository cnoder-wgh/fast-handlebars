import { Config } from '@jest/types';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  forceExit: true,
  testTimeout: 60000,
  collectCoverageFrom: ["<rootDir>/src/**"],
  coveragePathIgnorePatterns: ["<rootDir>/node_modules/"],
  coverageReporters: ["text-summary", "lcov", "cobertura", "html", "text"],
  reporters: ["default", "jest-junit"],
  coverageDirectory: "<rootDir>/coverage",
} as Config.InitialOptions;
