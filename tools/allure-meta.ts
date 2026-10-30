/**
 * Writes allure-results/executor.json (GitHub Actions or Jenkins build info when present, else local). Run before `allure generate`.
 * environment.properties and categories.json are written by allure-playwright (see playwright.config.ts).
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const e = process.env;
const ghaRun = e.GITHUB_ACTIONS ? `${e.GITHUB_SERVER_URL}/${e.GITHUB_REPOSITORY}/actions/runs/${e.GITHUB_RUN_ID}` : '';
const executor = ghaRun
  ? {
      name: 'GitHub Actions',
      type: 'github',
      url: e.GITHUB_SERVER_URL,
      buildOrder: Number(e.GITHUB_RUN_NUMBER),
      buildName: `${e.GITHUB_WORKFLOW} #${e.GITHUB_RUN_NUMBER}`,
      buildUrl: ghaRun,
      reportUrl: e.ALLURE_REPORT_URL || ghaRun,
    }
  : e.BUILD_URL
    ? {
        name: 'Jenkins',
        type: 'jenkins',
        url: e.JENKINS_URL,
        buildOrder: Number(e.BUILD_NUMBER),
        buildName: `${e.JOB_NAME} #${e.BUILD_NUMBER}`,
        buildUrl: e.BUILD_URL,
        reportUrl: `${e.BUILD_URL}allure/`,
      }
    : { name: 'local', type: 'local', buildName: `local ${e.RUN_ID ?? new Date().toISOString()}` };
mkdirSync('allure-results', { recursive: true });
writeFileSync('allure-results/executor.json', JSON.stringify(executor, null, 2) + '\n');
console.log(`executor.json: ${executor.name}`);
