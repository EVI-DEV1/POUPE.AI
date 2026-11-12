import js from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'test-results', 'playwright-report', 'blob-report']),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      prettier: prettierPlugin,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'prettier/prettier': ['error', { tabWidth: 2, useTabs: false }],
    },
  },
  {
    // Testes ponta a ponta (Playwright): o `use` das fixtures não é um hook do
    // React, e o Playwright exige `{}` quando a fixture não depende de outras.
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
    },
  },
]);
