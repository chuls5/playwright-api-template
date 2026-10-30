import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import local from './tools/eslint-rules/index.js';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'allure-results/', 'allure-report/', 'test-results/', 'ledger/', '.auth/'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': 'error',
    },
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
  },
  {
    files: ['targets/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    plugins: { ...playwright.configs['flat/recommended'].plugins, local },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-conditional-in-test': 'off', // data-driven matrices need branches on expected outcome
      'playwright/no-conditional-expect': 'off',
      'playwright/expect-expect': ['error', { assertFunctionNames: ['expectStatus', 'expectSchema', 'expectFasterThan'] }],
      'local/no-secret-literals': 'error',
    },
  },
  { files: ['targets/**/*.spec.ts'], plugins: { local }, rules: { 'local/require-level-tag': 'error', 'local/no-playwright-import-in-specs': 'error' } },
  { files: ['mock/**/*.ts', 'tools/**/*.ts'], rules: { 'no-console': 'off' } },
  { files: ['**/*.js', '**/*.mjs'], ...tseslint.configs.disableTypeChecked },
);
