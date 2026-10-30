/**
 * PR test selection for CI. Reads changed paths (one per line) on stdin and prints Playwright args.
 * Only target folders changed → run those targets in full. Anything shared (src, mock, config, deps) or a mix → @smoke.
 * Docs-only changes still run @smoke so the required check always reports.
 */
import { readFileSync } from 'node:fs';

const files = readFileSync(0, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);
const code = files.filter((f) => !/\.(md|txt)$/.test(f) && !f.startsWith('docs/'));
const targets = new Set<string>();
let shared = code.length === 0;
for (const f of code) {
  const m = /^targets\/([^/]+)\//.exec(f);
  if (m?.[1]) targets.add(m[1]);
  else shared = true;
}
const args = shared || targets.size === 0 ? '--grep @smoke' : [...targets].map((t) => `--project=${t}`).join(' ');
console.log(args);
