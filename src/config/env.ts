import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

/** Loads `.env.<TEST_ENV>` then `.env`. Values are never logged, only key names. */
let loaded = false;
export function loadEnv(): void {
  if (loaded) return;
  const name = process.env.TEST_ENV ?? 'local';
  loadDotenv({ path: `.env.${name}`, quiet: true });
  loadDotenv({ path: '.env', quiet: true });
  // Blank keys copied from .env.example mean 'unset', so defaults (`??`) still apply.
  for (const [k, v] of Object.entries(process.env)) if (v === '') delete process.env[k];
  loaded = true;
}

/** Parse a target's env schema; throws listing missing keys only. */
export function readEnv<T extends z.ZodRawShape>(shape: T): z.infer<z.ZodObject<T>> {
  loadEnv();
  const res = z.object(shape).safeParse(process.env);
  if (!res.success) {
    const keys = res.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid or missing env keys: ${keys}`);
  }
  return res.data;
}

export const runId: string =
  process.env.RUN_ID ??
  new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14);
