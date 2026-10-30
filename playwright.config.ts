import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
import { loadEnv, runId } from './src/config/env';

loadEnv();
const CI = !!process.env.CI;
const PETSTORE_URL = process.env.PETSTORE_BASE_URL ?? 'https://petstore3.swagger.io/api/v3/';
const TOOLSHOP_URL = process.env.TOOLSHOP_BASE_URL ?? 'https://api.practicesoftwaretesting.com/';
const COUNTRIES_URL = process.env.COUNTRIES_BASE_URL ?? 'https://countries.trevorblades.com/';
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 4010);
const MOCK_URL = process.env.MOCK_BANK_BASE_URL ?? `http://127.0.0.1:${MOCK_PORT}`;
const git = (c: string) => {
  try {
    return execSync(`git ${c}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'n/a';
  }
};

/** One project pair (setup → tests) per target. Select runs with --project and --grep on tags. */
export default defineConfig({
  testDir: './targets',
  fullyParallel: true,
  workers: Number(process.env.WORKERS ?? 1),
  retries: CI ? 1 : 0,
  forbidOnly: CI,
  timeout: 15_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        environmentInfo: {
          runId,
          testEnv: process.env.TEST_ENV ?? 'local',
          node: process.version,
          workers: String(process.env.WORKERS ?? 1),
          branch: process.env.GIT_BRANCH ?? git('rev-parse --abbrev-ref HEAD'),
          commit: process.env.GIT_COMMIT ?? git('rev-parse --short HEAD'),
          petstore: PETSTORE_URL,
          toolshop: TOOLSHOP_URL,
          countries: COUNTRIES_URL,
          mockBank: MOCK_URL,
        },
        categories: JSON.parse(readFileSync('reporting/categories.json', 'utf8')),
      },
    ],
  ],
  use: { extraHTTPHeaders: { 'User-Agent': 'playwright-api-template' } },
  webServer: {
    command: 'node mock/bank/server.ts',
    url: `${MOCK_URL}/health`,
    reuseExistingServer: !CI,
    env: { MOCK_PORT: String(MOCK_PORT) },
    stdout: 'ignore',
  },
  projects: [
    { name: 'petstore-setup', testMatch: /petstore\/.*\.setup\.ts/, use: { baseURL: PETSTORE_URL } },
    { name: 'petstore', testMatch: /petstore\/.*\.spec\.ts/, dependencies: ['petstore-setup'], use: { baseURL: PETSTORE_URL } },
    { name: 'toolshop-setup', testMatch: /toolshop\/.*\.setup\.ts/, use: { baseURL: TOOLSHOP_URL } },
    // Public shared demo, ~0.5–1 s per call: L3/L4 chains make 10+ calls, so a wider per-test budget.
    { name: 'toolshop', testMatch: /toolshop\/.*\.spec\.ts/, dependencies: ['toolshop-setup'], timeout: 45_000, use: { baseURL: TOOLSHOP_URL } },
    { name: 'countries-setup', testMatch: /countries\/.*\.setup\.ts/, use: { baseURL: COUNTRIES_URL } },
    { name: 'countries', testMatch: /countries\/.*\.spec\.ts/, dependencies: ['countries-setup'], use: { baseURL: COUNTRIES_URL } },
    { name: 'mock-bank-setup', testMatch: /mock-bank\/.*\.setup\.ts/, use: { baseURL: MOCK_URL } },
    { name: 'mock-bank', testMatch: /mock-bank\/.*\.spec\.ts/, dependencies: ['mock-bank-setup'], use: { baseURL: MOCK_URL } },
  ],
});
