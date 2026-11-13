// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'coverage/*'],
  },
  {
    // Logs go through src/lib/log.ts, which strips personal data first.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/log.ts'],
    rules: { 'no-console': 'error' },
  },
  {
    // One module per icon (src/components/ui/icons.ts): the package's own
    // entry point puts every Lucide icon in the app, a fifth of the bundle.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react-native',
              message: "Import each icon from 'lucide-react-native/icons/<name>' instead.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  {
    // Jest's mock factories and isolated modules load code with require().
    files: ['tests/**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]);
