/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',

  // Runs after the Jest test environment is set up — loads custom matchers.
  setupFilesAfterEnv: ['./jest.setup.ts'],

  // Map @/* absolute imports → src/* (mirrors tsconfig.json paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Extend the jest-expo default pattern to also transform ESM-only packages
  // used by RTK (immer, react-redux, redux ship ESM only in their dist).
  transformIgnorePatterns: [
    '/node_modules/(?!(' +
      [
        '.pnpm',
        'react-native',
        '@react-native',
        '@react-native-community',
        'expo',
        '@expo',
        '@expo-google-fonts',
        'react-navigation',
        '@react-navigation',
        '@sentry/react-native',
        'native-base',
        'standard-navigation',
        // ── RTK / state management ──
        'immer',
        '@reduxjs',
        'redux',
        'react-redux',
        'reselect',
      ].join('|') +
      '))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],

  // Collect coverage from src/
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
