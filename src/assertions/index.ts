import { expect } from '@playwright/test';
import type { z } from 'zod';
import type { ApiResponse } from '../client/api-client';

/** Asserts status with the response body in the failure message. */
export function expectStatus(res: ApiResponse, status: number | readonly number[]): void {
  const allowed = Array.isArray(status) ? status : [status];
  expect(allowed, `HTTP ${res.status} (corr ${res.correlationId}): ${res.text.slice(0, 500)}`).toContain(res.status);
}

/** Parses the body with a Zod schema; returns the typed value or fails with readable issues. */
export function expectSchema<S extends z.ZodType>(res: ApiResponse, schema: S): z.infer<S> {
  const r = schema.safeParse(res.body);
  expect(r.success, r.success ? '' : `schema mismatch: ${JSON.stringify(r.error.issues, null, 2)}`).toBe(true);
  return r.data as z.infer<S>;
}

/** Response time budget per call. */
export function expectFasterThan(res: ApiResponse, ms: number): void {
  expect(res.durationMs, `took ${res.durationMs} ms (budget ${ms} ms)`).toBeLessThan(ms);
}
