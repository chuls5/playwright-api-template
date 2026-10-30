/** Keys whose values are masked in every attachment and log. Matching is case-insensitive substring. */
export const SENSITIVE_KEYS = [
  'authorization',
  'x-signature',
  'cookie',
  'password',
  'secret',
  'otp',
  'challengeanswer',
  'ssn',
  'taxid',
  'dob',
  'dateofbirth',
  'cardnumber',
  'pan',
  'api_key',
  'client_secret',
  'token',
] as const;
const LAST4_KEYS = ['accountnumber', 'cardnumber', 'pan'];

function isSensitive(key: string): boolean {
  const k = key.toLowerCase();
  return SENSITIVE_KEYS.some((s) => k.includes(s));
}

export function maskValue(key: string, value: unknown): unknown {
  const k = key.toLowerCase();
  if (typeof value === 'string' && LAST4_KEYS.some((s) => k.includes(s)) && value.length > 4) {
    return `****${value.slice(-4)}`;
  }
  return '***';
}

/** Deep-copies and masks sensitive fields. Safe for JSON-like values. */
export function redact<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => redact(v)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const k2 = k.toLowerCase();
      if (LAST4_KEYS.some((s) => k2.includes(s))) out[k] = maskValue(k, v);
      else if (isSensitive(k) && (typeof v !== 'object' || v === null)) out[k] = maskValue(k, v);
      else out[k] = redact(v);
    }
    return out as T;
  }
  return value;
}
