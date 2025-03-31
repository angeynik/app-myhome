module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'vue'],
    transform: {
      '^.+\\.js$': 'babel-jest',
      '^.+\\.vue$': '@vue/vue3-jest', // Для работы с Vue 3
      '^.+\\.ts$': 'ts-jest', // Добавляем поддержку TypeScript
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1', // Корректный путь с использованием <rootDir>
    },
    testEnvironment: 'jsdom', // Для тестирования в браузерной среде
  };