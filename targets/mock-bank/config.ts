import { z } from 'zod';
import { loadEnv, readEnv } from '../../src';

loadEnv();
const fake = (d: string) => Buffer.from(`mock-secret-${d}`).toString('base64');

/**
 * All values come from env. Defaults are the mock's fake dev identities only (they unlock nothing real).
 * For a real environment, set every MOCK_BANK_* key in .env (see .env.example) — the defaults must not be reused.
 */
export const cfg = readEnv({
  MOCK_BANK_TOKEN_URL: z.string().default('/auth/service-token'),
  MOCK_BANK_PASSWORD: z.string().default('mock-password'),
  MOCK_BANK_OTP: z.string().default('000000'),
  MOCK_BANK_TOKEN_TTL_MS: z.coerce.number().int().positive().default(300_000),
  MOCK_BANK_CORE_CLIENT_ID: z.string().default('demo-core'),
  MOCK_BANK_CORE_SECRET: z.string().default(fake('core')),
  MOCK_BANK_ONBOARDING_CLIENT_ID: z.string().default('demo-onboarding'),
  MOCK_BANK_ONBOARDING_SECRET: z.string().default(fake('onboarding')),
  MOCK_BANK_LIMITS_CLIENT_ID: z.string().default('demo-limits'),
  MOCK_BANK_LIMITS_SECRET: z.string().default(fake('limits')),
  MOCK_BANK_PAYMENTS_CLIENT_ID: z.string().default('demo-payments'),
  MOCK_BANK_PAYMENTS_SECRET: z.string().default(fake('payments')),
  MOCK_BANK_SERVICING_CLIENT_ID: z.string().default('demo-servicing'),
  MOCK_BANK_SERVICING_SECRET: z.string().default(fake('servicing')),
});
