import { test as base } from '@playwright/test';
import { runId } from '../config/env';
import { Ledger, Rng } from '../data';
import { suiteLabels } from '../reporting/allure';

export interface Cleanup {
  /** Register an undo step; runs LIFO after the test, best-effort, never fails a passing test. Throw → ledger `cleanup-failed`; return `'left'` → `left` (server keeps it by design). */
  add(entity: { type: string; id: string }, undo: () => Promise<unknown>): void;
  /** Record an entity that cannot be cleaned up (fresh-data-per-run). */
  leave(entity: { type: string; id: string }): void;
}

interface BaseFixtures {
  rng: Rng;
  cleanup: Cleanup;
  /** Auto: Allure suite labels from project + tags. */
  allureSuites: void;
}
interface BaseWorkerFixtures {
  ledger: Ledger;
}

export const test = base.extend<BaseFixtures, BaseWorkerFixtures>({
  ledger: [async ({}, use) => use(new Ledger(runId)), { scope: 'worker' }],
  allureSuites: [
    async ({}, use, info) => {
      await suiteLabels(info);
      await use();
    },
    { auto: true },
  ],

  rng: async ({}, use, info) => {
    const seed = `${runId}|${info.workerIndex}|${info.testId}|${info.retry}`;
    info.annotations.push({ type: 'rng-seed', description: seed });
    await use(new Rng(seed));
  },

  cleanup: async ({ ledger }, use, info) => {
    const steps: { entity: { type: string; id: string }; undo: () => Promise<unknown> }[] = [];
    await use({
      add: (entity, undo) => {
        ledger.write({ ...entity, test: info.titlePath.join(' > '), cleanup: 'delete', status: 'created' });
        steps.push({ entity, undo });
      },
      leave: (entity) => ledger.write({ ...entity, test: info.titlePath.join(' > '), cleanup: 'none', status: 'left' }),
    });
    for (const s of steps.reverse()) {
      try {
        const r = await s.undo();
        ledger.write({ ...s.entity, test: info.title, cleanup: 'delete', status: r === 'left' ? 'left' : 'cleaned' });
      } catch (e) {
        ledger.write({ ...s.entity, test: info.title, cleanup: 'delete', status: 'cleanup-failed' });
        info.annotations.push({ type: 'cleanup-failed', description: `${s.entity.type} ${s.entity.id}: ${String(e)}` });
      }
    }
  },
});

export { expect } from '@playwright/test';
