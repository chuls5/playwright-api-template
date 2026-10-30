import type { Rng } from './rng';

/**
 * Synthetic identity data. Never real people. Shapes follow common US formats;
 * SSNs avoid SSA-invalid ranges unless `invalid` is requested for negative tests.
 */
export function ssn(rng: Rng, o: { invalid?: boolean } = {}): string {
  if (o.invalid) return `000${rng.digits(2)}${rng.digits(4)}`;
  let area: number;
  do area = rng.int(1, 899);
  while (area === 666);
  const group = rng.int(1, 99);
  const serial = rng.int(1, 9999);
  return `${String(area).padStart(3, '0')}${String(group).padStart(2, '0')}${String(serial).padStart(4, '0')}`;
}

/** ISO date of birth strictly inside [minAge, maxAge] (default 18–100); day 1–28 avoids month-length edge cases. */
export function dob(rng: Rng, o: { minAge?: number; maxAge?: number; now?: Date } = {}): string {
  // +1 / -1 year of margin so day-of-year never pushes the age outside [minAge, maxAge].
  const y = (o.now ?? new Date()).getFullYear() - rng.int((o.minAge ?? 18) + 1, (o.maxAge ?? 100) - 1);
  return `${y}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`;
}

export function phone(rng: Rng, areaCodes: readonly string[]): string {
  return `${rng.pick(areaCodes)}${rng.int(2, 9)}${rng.digits(6)}`;
}

export function email(rng: Rng, domain: string, prefix = 'Auto'): string {
  return `${prefix}${rng.letters(6)}${rng.digits(6)}@${domain}`;
}

export function personName(rng: Rng): { first: string; last: string } {
  const first = ['Ava', 'Liam', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Leo'];
  const last = ['Testa', 'Probe', 'Sample', 'Mockley', 'Fixture', 'Stub'];
  return { first: rng.pick(first), last: `${rng.pick(last)}${rng.letters(4)}` };
}

export function businessName(rng: Rng): string {
  return `Auto Business ${rng.letters(7)}`;
}

/** Money is integer minor units + ISO 4217 code. Never floats. */
export interface Money {
  amountMinor: number;
  currency: string;
}
export const usd = (amountMinor: number): Money => {
  if (!Number.isInteger(amountMinor)) throw new Error(`amountMinor must be an integer, got ${amountMinor}`);
  return { amountMinor, currency: 'USD' };
};
