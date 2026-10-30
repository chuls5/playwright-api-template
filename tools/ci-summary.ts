/**
 * Counts final test outcomes from allure-results (last attempt per test, so a retried pass counts once as passed)
 * and prints a Markdown table. CI appends it to $GITHUB_STEP_SUMMARY. Usage: node tools/ci-summary.ts [dir] [title]
 */
import { readdirSync, readFileSync } from 'node:fs';

const dir = process.argv[2] ?? 'allure-results';
const title = process.argv[3] ?? 'Test results';
type R = { historyId?: string; uuid: string; status?: string; stop?: number; labels?: { name: string; value: string }[] };
const latest = new Map<string, R>();
for (const f of readdirSync(dir).filter((n) => n.endsWith('-result.json'))) {
  const r = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as R;
  const key = r.historyId ?? r.uuid;
  const prev = latest.get(key);
  if (!prev || (r.stop ?? 0) > (prev.stop ?? 0)) latest.set(key, r);
}
const counts = { passed: 0, failed: 0, broken: 0, skipped: 0, unknown: 0 };
type S = keyof typeof counts;
let envUnavailable = 0;
for (const r of latest.values()) {
  const s = (r.status && r.status in counts ? r.status : 'unknown') as S;
  counts[s]++;
  if (r.labels?.some((l) => l.name === 'env' && l.value === 'unavailable')) envUnavailable++;
}
const total = latest.size;
const ok = counts.failed + counts.broken === 0 && total > 0;
console.log(`### ${ok ? '✅' : '❌'} ${title}\n`);
console.log('| total | passed | failed | broken | skipped |\n|---|---|---|---|---|');
console.log(`| ${total} | ${counts.passed} | ${counts.failed} | ${counts.broken} | ${counts.skipped} |\n`);
if (envUnavailable) console.log(`${envUnavailable} test(s) marked Environment (target unavailable) — not a product defect.\n`);
