import { z } from 'zod';
import { loadEnv, readEnv } from '../../src';

loadEnv();

/**
 * Practice Software Testing ("Toolshop") public demo. Defaults are the demo accounts the vendor publishes on the
 * login page; they unlock nothing real. Base URL: TOOLSHOP_BASE_URL in playwright.config.ts. A self-hosted Toolshop sets its own TOOLSHOP_* values in .env.
 */
export const cfg = readEnv({
  TOOLSHOP_ADMIN_EMAIL: z.string().email().default('admin@practicesoftwaretesting.com'),
  TOOLSHOP_CUSTOMER_EMAIL: z.string().email().default('customer@practicesoftwaretesting.com'),
  TOOLSHOP_CUSTOMER2_EMAIL: z.string().email().default('customer2@practicesoftwaretesting.com'),
  TOOLSHOP_DEMO_PASSWORD: z.string().default('welcome01'),
});

export const ROLES = ['admin', 'customer', 'customer2'] as const;
export type Role = (typeof ROLES)[number];
export const emailFor = (r: Role): string =>
  ({ admin: cfg.TOOLSHOP_ADMIN_EMAIL, customer: cfg.TOOLSHOP_CUSTOMER_EMAIL, customer2: cfg.TOOLSHOP_CUSTOMER2_EMAIL })[r];
