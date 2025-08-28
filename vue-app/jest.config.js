module.exports = {
  collectCoverage: true,
  coverageReporters: ['lcov', 'text'],
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue3-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/tests/unit/**/*.spec.js'
  ]
};