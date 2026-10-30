// Allure 3 report config. Categories: one source (reporting/categories.json, also written into allure-results for
// Allure 2 plugins). The label matcher catches tests marked by markEnvUnavailable() whose message alone
// doesn't show it (e.g. a cached token 401 after a demo DB reset).
import { readFileSync } from 'node:fs';

const categories = JSON.parse(readFileSync(new URL('./reporting/categories.json', import.meta.url), 'utf8'));
const [env, ...rest] = categories;
const { matchedStatuses, messageRegex, ...envMeta } = env;

export default {
  name: 'playwright-api-template',
  output: 'allure-report',
  // CI restores the previous history.jsonl (from Pages) into this path so trends survive across runs.
  ...(process.env.ALLURE_HISTORY_PATH ? { historyPath: process.env.ALLURE_HISTORY_PATH } : {}),
  categories: [
    {
      ...envMeta,
      matchers: [{ statuses: matchedStatuses, message: messageRegex }, (d) => d.labels.some((l) => l.name === 'env' && l.value === 'unavailable')],
    },
    ...rest,
  ],
};
