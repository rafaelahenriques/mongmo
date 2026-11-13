// Tests: `npm test` runs the unit tests, `npm run test:integration` the
// integration tests against a running Supabase (see tests/README.md).
// https://docs.expo.dev/develop/unit-testing/

/** The app's import aliases from tsconfig.json; assets first, it's the narrower one. */
const moduleNameMapper = {
  '^@/assets/(.*)$': '<rootDir>/assets/$1',
  '^@/(.*)$': '<rootDir>/src/$1',
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts?(x)'],
      setupFiles: ['<rootDir>/tests/unit/env.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.ts'],
      // Stylesheets first: the first matching pattern wins.
      moduleNameMapper: {
        '\\.css$': '<rootDir>/tests/unit/cssStub.js',
        // The icon library's CommonJS build: Jest can't load its .mjs one.
        '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
        '^lucide-react-native/icons/(.*)$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1.js',
        ...moduleNameMapper,
      },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
      ],
    },
    {
      // The real database, auth and API: run one file at a time against a
      // local Supabase with every migration and the seed applied.
      displayName: 'integration',
      preset: 'jest-expo/node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
      moduleNameMapper,
    },
  ],
};
