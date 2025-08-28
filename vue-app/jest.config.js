const path = require('path');

module.exports = {
  collectCoverage: true,
  coverageReporters: ['lcov', 'text'],
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue3-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': path.resolve(__dirname, 'src/$1'),
    '^@components/(.*)$': path.resolve(__dirname, 'src/components/$1'),
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    },
  transformIgnorePatterns: [
    'node_modules/(?!(your-module|@vue/test-utils)/)'
  ],
  testMatch: [
    '<rootDir>/src/tests/unit/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/tests/unit/setup.js']
};