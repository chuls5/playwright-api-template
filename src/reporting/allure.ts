import { test, type TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { redact } from './redact';

/** Attach a JSON payload to the current test (Allure picks up Playwright attachments). Always redacted. */
export async function attachJson(name: string, payload: unknown): Promise<void> {
  try {
    await test.info().attach(name, { body: JSON.stringify(redact(payload), null, 2), contentType: 'application/json' });
  } catch {
    // outside a test (e.g. global setup): nothing to attach to
  }
}

/** Allure tree: target (project) › level (@L<n>) › op (@api:<id>, first one). */
export async function suiteLabels(info: TestInfo): Promise<void> {
  const tags = info.tags;
  await allure.parentSuite(info.project.name.replace(/-setup$/, ''));
  await allure.suite(tags.find((t) => /^@L\d$/.test(t))?.slice(1) ?? (info.project.name.endsWith('-setup') ? 'L0' : 'untagged'));
  await allure.subSuite(tags.find((t) => t.startsWith('@api:'))?.slice(5) ?? info.titlePath.at(-2) ?? '');
}

/**
 * Marks a failed test as an environment failure (shared demo reset/outage), not a product or test defect.
 * Adds an `env-unavailable` annotation and Allure label; `allurerc.mjs` categorises on the label. No retry.
 */
export async function markEnvUnavailable(info: TestInfo, reason: string): Promise<void> {
  info.annotations.push({ type: 'env-unavailable', description: reason });
  await allure.label('env', 'unavailable');
}
