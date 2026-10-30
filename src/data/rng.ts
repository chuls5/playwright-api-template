import { createHash } from 'node:crypto';

/** Deterministic PRNG (mulberry32). Same seed → same data, so failures reproduce. */
export class Rng {
  private s: number;
  readonly seed: string;
  constructor(seed: string) {
    this.seed = seed;
    this.s = createHash('sha256').update(seed).digest().readUInt32LE(0);
  }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick<T>(items: readonly T[]): T {
    const v = items[this.int(0, items.length - 1)];
    if (v === undefined) throw new Error('pick from empty list');
    return v;
  }
  letters(n: number): string {
    return Array.from({ length: n }, () => String.fromCharCode(97 + this.int(0, 25))).join('');
  }
  digits(n: number): string {
    return Array.from({ length: n }, () => String(this.int(0, 9))).join('');
  }
  /** Positive 9-digit integer id, safe for APIs that need numeric ids. */
  id(): number {
    return this.int(100_000_000, 999_999_999);
  }
}
