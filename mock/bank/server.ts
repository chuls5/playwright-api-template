/**
 * mock-bank: local test double for common banking function-API patterns.
 * Design aid only — not evidence of any real platform's behaviour. Node built-ins only; run with `node mock/bank/server.ts`.
 * Patterns: HMAC service v2 tokens + scopes, user session token + OTP step-up, versioned function calls,
 * x-user-* headers, Idempotency-Key replay, role authz, limits, business days, fault injection.
 */
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

const env = process.env;
const PORT = Number(env.MOCK_PORT ?? 4010);
const OTP = env.MOCK_OTP ?? '000000';
const PASSWORD = env.MOCK_PASSWORD ?? 'mock-password';
const SKEW_MS = Number(env.MOCK_SKEW_MS ?? 300_000);
const SERVICE_TTL_MS = Number(env.MOCK_SERVICE_TTL_MS ?? 600_000);
const DISABLE_V3 = env.MOCK_DISABLE_CHALLENGE_V3 === '1';

// ---------- identities (fake, dev-only) ----------
type Domain = 'core' | 'onboarding' | 'limits' | 'payments' | 'servicing';
const fakeSecret = (d: string) => Buffer.from(`mock-secret-${d}`).toString('base64');
const DOMAINS: Record<Domain, { clientId: string; secret: string; scopes: string[] }> = {
  core: {
    clientId: 'demo-core',
    secret: fakeSecret('core'),
    scopes: ['function:/GetNextBusinessDay.v1', 'function:/ReadCustomer.v1'],
  },
  onboarding: { clientId: 'demo-onboarding', secret: fakeSecret('onboarding'), scopes: ['/applications::post', '/applications::delete', '/applications::get'] },
  limits: { clientId: 'demo-limits', secret: fakeSecret('limits'), scopes: ['function:/ReadTransactionLimits.v2'] },
  payments: { clientId: 'demo-payments', secret: fakeSecret('payments'), scopes: ['function:/CreateScheduledTransfer.v1'] },
  servicing: {
    clientId: 'demo-servicing',
    secret: fakeSecret('servicing'),
    scopes: ['function:/CreateAccountHold.v1', 'function:/ReadAccountHolds.v1', 'function:/DeleteAccountHold.v1'],
  },
};
const byClientId = new Map(Object.values(DOMAINS).map((d) => [d.clientId, d]));

/** Independent implementation of the v2 signature (manual base64 → url-safe) to cross-check the client signer. */
function sign(clientId: string, base64Secret: string, ts: string): string {
  const b64 = createHmac('sha256', Buffer.from(base64Secret, 'base64')).update(`${clientId}:2:${ts}`, 'utf8').digest('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------- state ----------
type Role = 'PRIMARY' | 'JOINT_OWNER' | 'POWER_OF_ATTORNEY' | 'VIEW_ONLY';
interface User {
  userId: string;
  role: Role;
  ssn: string;
  customerId: string;
}
interface Account {
  accountId: string;
  customerId: string;
  balanceMinor: number;
}
interface Customer {
  customerId: string;
  applicationId: string;
  utilizedDaily: number;
  utilizedWeekly: number;
}
const users = new Map<string, User>();
const accounts = new Map<string, Account>();
const customers = new Map<string, Customer>();
const restrictions = new Map<string, { restrictionId: string; accountId: string; code: string }>();
const appTokens = new Map<string, { scopes: string[]; exp: number }>();
const userTokens = new Map<string, { userId: string; elevated: boolean }>();
const challenges = new Map<string, string>(); // channelEncryptedValue -> userId
const idem = new Map<string, { bodyHash: string; status: number; body: unknown }>();
const flaky = new Map<string, number>();

const LIMITS = { DAILY: 500_000, WEEKLY: 1_000_000, PER_TXN: 250_000 };
const HOLIDAYS = new Set(['2026-11-26', '2026-12-25', '2027-01-01', '2027-01-18', '2027-05-31', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24']);

// ---------- function catalog: auth mode per function version ----------
type Access = 'read' | 'servicing' | 'money';
type Fn = { mode: 'user'; access: Access; handler: Handler } | { mode: 'service'; scope: string; handler: Handler };
type Ctx = { body: Record<string, unknown>; user?: User; idemKey?: string; headers: IncomingMessage['headers'] };
type Result = { status: number; body: unknown };
type Handler = (c: Ctx) => Result;

/** Role matrix (mock assumption for POA: reads only — real POA intent is unconfirmed). */
const ALLOW: Record<Role, Access[]> = {
  PRIMARY: ['read', 'servicing', 'money'],
  JOINT_OWNER: ['read', 'servicing', 'money'],
  POWER_OF_ATTORNEY: ['read'],
  VIEW_ONLY: ['read'],
};
// Statement download is a read that VIEW_ONLY is denied in the real suite.
const VIEW_ONLY_DENY = new Set(['ReadStatement.v1']);

const err = (status: number, code: string, message = code): Result => ({ status, body: { code, message } });
const ownAccount = (u: User | undefined, id: unknown) => {
  const a = accounts.get(String(id));
  return a && u && a.customerId === u.customerId ? a : undefined;
};
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
function nextBusinessDay(from: string): string {
  const d = new Date(`${from}T12:00:00Z`);
  do d.setUTCDate(d.getUTCDate() + 1);
  while ([0, 6].includes(d.getUTCDay()) || HOLIDAYS.has(isoDate(d)));
  return isoDate(d);
}
const isBusinessDay = (s: string) => {
  const d = new Date(`${s}T12:00:00Z`);
  return ![0, 6].includes(d.getUTCDay()) && !HOLIDAYS.has(s);
};

function validateTransfer(c: Ctx, from: Account | undefined, to: Account | undefined): Result | undefined {
  const amt = c.body.amountMinor;
  if (typeof amt !== 'number' || !Number.isInteger(amt) || amt <= 0) return err(400, 'INVALID_AMOUNT');
  if (!from) return err(404, 'ACCOUNT_NOT_FOUND', 'fromAccountId');
  if (!to) return err(404, 'ACCOUNT_NOT_FOUND', 'toAccountId');
  if (from.accountId === to.accountId) return err(422, 'SAME_ACCOUNT');
  const cust = customers.get(from.customerId);
  if (!cust) return err(404, 'CUSTOMER_NOT_FOUND');
  if (amt > LIMITS.PER_TXN) return err(422, 'LIMIT_EXCEEDED', 'PER_TXN');
  if (cust.utilizedDaily + amt > LIMITS.DAILY) return err(422, 'LIMIT_EXCEEDED', 'DAILY');
  if (cust.utilizedWeekly + amt > LIMITS.WEEKLY) return err(422, 'LIMIT_EXCEEDED', 'WEEKLY');
  if (from.balanceMinor < amt) return err(422, 'INSUFFICIENT_FUNDS');
  return undefined;
}

const FUNCTIONS: Record<string, Fn> = {
  'GetNextBusinessDay.v1': {
    mode: 'service',
    scope: 'function:/GetNextBusinessDay.v1',
    handler: ({ body }) => {
      const from = String(body.fromDate ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return err(400, 'INVALID_DATE');
      return { status: 200, body: { fromDate: from, nextBusinessDay: nextBusinessDay(from) } };
    },
  },
  'ReadCustomer.v1': {
    mode: 'service',
    scope: 'function:/ReadCustomer.v1',
    handler: ({ body }) => {
      const c = customers.get(String(body.customerId));
      if (!c) return err(404, 'CUSTOMER_NOT_FOUND');
      const stakeholders = [...users.values()].filter((u) => u.customerId === c.customerId).map((u) => ({ userId: u.userId, role: u.role }));
      return { status: 200, body: { customerId: c.customerId, stakeholders } };
    },
  },
  'ReadTransactionLimits.v2': {
    mode: 'service',
    scope: 'function:/ReadTransactionLimits.v2',
    handler: ({ body }) => limitsFor(String(body.customerId)),
  },
  'ReadTransactionLimits.v1': { mode: 'user', access: 'read', handler: ({ user }) => limitsFor(user?.customerId ?? '') },
  'ReadAccounts.v1': {
    mode: 'user',
    access: 'read',
    handler: ({ user }) => ({ status: 200, body: { accounts: [...accounts.values()].filter((a) => a.customerId === user?.customerId) } }),
  },
  'ReadStatement.v1': {
    mode: 'user',
    access: 'read',
    handler: ({ user, body }) =>
      ownAccount(user, body.accountId) ? { status: 200, body: { documentId: randomUUID(), format: 'PDF' } } : err(404, 'ACCOUNT_NOT_FOUND'),
  },
  'CreatePayee.v1': {
    mode: 'user',
    access: 'servicing',
    handler: ({ body }) =>
      typeof body.nickname === 'string' && body.nickname
        ? { status: 201, body: { payeeId: randomUUID(), nickname: body.nickname } }
        : err(400, 'NICKNAME_REQUIRED'),
  },
  'CreateTransfer.v1': {
    mode: 'user',
    access: 'money',
    handler: (c) => {
      const from = ownAccount(c.user, c.body.fromAccountId);
      const to = ownAccount(c.user, c.body.toAccountId);
      const bad = validateTransfer(c, from, to);
      if (bad) return bad;
      const amt = c.body.amountMinor as number;
      from!.balanceMinor -= amt;
      to!.balanceMinor += amt;
      const cust = customers.get(from!.customerId)!;
      cust.utilizedDaily += amt;
      cust.utilizedWeekly += amt;
      return { status: 201, body: { transferId: randomUUID(), status: 'COMPLETED', amountMinor: amt } };
    },
  },
  'CreateScheduledTransfer.v1': {
    mode: 'service',
    scope: 'function:/CreateScheduledTransfer.v1',
    handler: (c) => {
      const date = String(c.body.executionDate ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return err(400, 'INVALID_DATE');
      if (date <= isoDate(new Date())) return err(422, 'DATE_NOT_IN_FUTURE');
      if (!isBusinessDay(date)) return err(422, 'NOT_BUSINESS_DAY');
      const from = accounts.get(String(c.body.fromAccountId));
      const to = accounts.get(String(c.body.toAccountId));
      const amt = c.body.amountMinor;
      if (typeof amt !== 'number' || !Number.isInteger(amt) || amt <= 0) return err(400, 'INVALID_AMOUNT');
      if (!from || !to) return err(404, 'ACCOUNT_NOT_FOUND');
      return { status: 201, body: { transferId: randomUUID(), status: 'SCHEDULED', executionDate: date } };
    },
  },
  'CreateAccountHold.v1': {
    mode: 'service',
    scope: 'function:/CreateAccountHold.v1',
    handler: ({ body }) => {
      if (!accounts.has(String(body.accountId))) return err(404, 'ACCOUNT_NOT_FOUND');
      if (!['DEBIT_FREEZE', 'FULL_FREEZE'].includes(String(body.code))) return err(400, 'INVALID_CODE');
      const r = { restrictionId: randomUUID(), accountId: String(body.accountId), code: String(body.code) };
      restrictions.set(r.restrictionId, r);
      return { status: 201, body: r };
    },
  },
  'ReadAccountHolds.v1': {
    mode: 'service',
    scope: 'function:/ReadAccountHolds.v1',
    handler: ({ body }) => ({ status: 200, body: { restrictions: [...restrictions.values()].filter((r) => r.accountId === String(body.accountId)) } }),
  },
  'DeleteAccountHold.v1': {
    mode: 'service',
    scope: 'function:/DeleteAccountHold.v1',
    handler: ({ body }) => (restrictions.delete(String(body.restrictionId)) ? { status: 204, body: undefined } : err(404, 'RESTRICTION_NOT_FOUND')),
  },
};

function limitsFor(customerId: string): Result {
  const c = customers.get(customerId);
  if (!c) return err(404, 'CUSTOMER_NOT_FOUND');
  return {
    status: 200,
    body: {
      limits: [
        { type: 'PER_TXN', limitMinor: LIMITS.PER_TXN, utilizedMinor: 0 },
        { type: 'DAILY', limitMinor: LIMITS.DAILY, utilizedMinor: c.utilizedDaily },
        { type: 'WEEKLY', limitMinor: LIMITS.WEEKLY, utilizedMinor: c.utilizedWeekly },
      ],
    },
  };
}

// ---------- http plumbing ----------
async function readBody(req: IncomingMessage): Promise<{ raw: string; json: Record<string, unknown>; form: URLSearchParams }> {
  const chunks: Buffer[] = [];
  for await (const ch of req) chunks.push(ch as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  let json: Record<string, unknown> = {};
  if ((req.headers['content-type'] ?? '').includes('json') && raw) {
    try {
      json = JSON.parse(raw);
    } catch {
      json = { __invalid: true };
    }
  }
  return { raw, json, form: new URLSearchParams(raw) };
}
function send(res: ServerResponse, r: Result, extra: Record<string, string> = {}): void {
  res.writeHead(r.status, { 'content-type': 'application/json', ...extra });
  res.end(r.body === undefined ? '' : JSON.stringify(r.body));
}
/** Both identities use `Authorization: Bearer`; service and user tokens live in separate stores, so one never passes as the other. */
function bearer(req: IncomingMessage): string | undefined {
  return /^Bearer (.+)$/.exec(String(req.headers.authorization ?? ''))?.[1];
}
function appTokenOk(req: IncomingMessage, scope: string): Result | undefined {
  const t = bearer(req);
  const rec = t ? appTokens.get(t) : undefined;
  if (!rec || rec.exp < Date.now()) return err(401, 'UNAUTHORIZED');
  if (!rec.scopes.includes(scope)) return err(403, 'SCOPE_MISSING', scope);
  return undefined;
}

/** x-mock-fault: 500 | 504 | 401 | delay:<ms> | flaky:<n>:<key> (fail n times with 503, then pass). */
async function fault(req: IncomingMessage): Promise<Result | undefined> {
  const f = String(req.headers['x-mock-fault'] ?? '');
  if (!f) return undefined;
  if (/^(500|504|401)$/.test(f)) return err(Number(f), 'INJECTED_FAULT');
  if (f.startsWith('delay:')) await new Promise((r) => setTimeout(r, Math.min(Number(f.slice(6)), 10_000)));
  if (f.startsWith('flaky:')) {
    const [, n, key] = f.split(':');
    const seen = flaky.get(key ?? '') ?? 0;
    flaky.set(key ?? '', seen + 1);
    if (seen < Number(n)) return err(503, 'INJECTED_FAULT');
  }
  return undefined;
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://mock');
    const p = url.pathname;
    const { raw, json, form } = await readBody(req);
    const injected = await fault(req);
    if (injected) return send(res, injected);

    if (p === '/health') return send(res, { status: 200, body: { status: 'UP' } });

    if (p === '/__kat') {
      const clientId = url.searchParams.get('clientId') ?? 'kat-app';
      const secret = url.searchParams.get('secret') ?? Buffer.from('kat-secret').toString('base64');
      const ts = url.searchParams.get('ts') ?? '1700000000000';
      return send(res, { status: 200, body: { clientId, secret, ts, data: `${clientId}:2:${ts}`, signature: sign(clientId, secret, ts) } });
    }
    if (p === '/__admin/revoke-tokens' && req.method === 'POST') {
      appTokens.clear();
      userTokens.clear();
      return send(res, { status: 204, body: undefined });
    }

    // service token
    if (p === '/auth/service-token' && req.method === 'POST') {
      const h = req.headers;
      const clientId = String(h['x-client-id'] ?? '');
      const d = byClientId.get(clientId);
      if (!d) return send(res, err(401, 'UNKNOWN_APP'));
      if (h['x-signature-version'] !== '2') return send(res, err(401, 'UNSUPPORTED_VERSION'));
      const ts = String(h['x-timestamp'] ?? '');
      if (!/^\d+$/.test(ts) || Math.abs(Date.now() - Number(ts)) > SKEW_MS) return send(res, err(401, 'STALE_TIMESTAMP'));
      const expected = Buffer.from(sign(clientId, d.secret, ts));
      const got = Buffer.from(String(h['x-signature'] ?? ''));
      if (expected.length !== got.length || !timingSafeEqual(expected, got)) return send(res, err(401, 'BAD_SIGNATURE'));
      const scopes = Array.isArray(json.scope) ? json.scope.map(String) : [];
      const denied = scopes.filter((s) => !d.scopes.includes(s));
      if (!scopes.length || denied.length) return send(res, err(403, 'SCOPE_NOT_ALLOWED', denied.join(',')));
      const token = randomUUID();
      appTokens.set(token, { scopes, exp: Date.now() + SERVICE_TTL_MS });
      return send(res, { status: 200, body: { authorization_token: token } });
    }

    // User logon + step-up
    if (p === '/auth/login' && req.method === 'POST') {
      const u = users.get(form.get('UserID') ?? '');
      if (!u || form.get('Password') !== PASSWORD) return send(res, err(401, 'INVALID_CREDENTIALS'));
      const sessionToken = randomUUID();
      userTokens.set(sessionToken, { userId: u.userId, elevated: false });
      return send(res, { status: 200, body: { sessionToken, assessmentToken: randomUUID() } });
    }
    const challengeMatch = /^\/authentication\/challenges\/v([123])$/.exec(p);
    if (challengeMatch) {
      if (DISABLE_V3 && challengeMatch[1] === '3') return send(res, err(404, 'NOT_FOUND'));
      const t = userTokens.get(bearer(req) ?? '');
      if (!t) return send(res, err(401, 'UNAUTHORIZED'));
      const cev = randomUUID();
      challenges.set(cev, t.userId);
      return send(res, { status: 200, body: { channelEncryptedValue: cev, types: ['OTP', 'TAX_IDENTIFICATION_NO'] } });
    }
    if (p === '/otp/delivery/v3') {
      if (!userTokens.get(bearer(req) ?? '')) return send(res, err(401, 'UNAUTHORIZED'));
      return send(res, challenges.has(String(json.channelEncryptedValue)) ? { status: 200, body: { delivered: true } } : err(400, 'UNKNOWN_CHALLENGE'));
    }
    if (p === '/authentication/token/v3') {
      const t = userTokens.get(bearer(req) ?? '');
      if (!t) return send(res, err(401, 'UNAUTHORIZED'));
      const a = (json.challengeAnswer ?? {}) as { type?: string; value?: string; encryptedValue?: string };
      if (challenges.get(String(a.encryptedValue)) !== t.userId) return send(res, err(400, 'UNKNOWN_CHALLENGE'));
      const u = users.get(t.userId)!;
      const correct = a.type === 'OTP' ? a.value === OTP : a.type === 'TAX_IDENTIFICATION_NO' ? a.value === u.ssn : false;
      if (!correct) return send(res, err(401, 'CHALLENGE_FAILED'));
      challenges.delete(String(a.encryptedValue));
      const sessionToken = randomUUID();
      userTokens.set(sessionToken, { userId: u.userId, elevated: true });
      return send(res, { status: 200, body: { sessionToken } });
    }

    // Onboarding (REST, onboarding service scopes)
    if (p === '/applications' && req.method === 'POST') {
      const bad = appTokenOk(req, '/applications::post');
      if (bad) return send(res, bad);
      const roles = (Array.isArray(json.stakeholders) ? json.stakeholders : []) as Role[];
      const primarySsn = String(json.ssn ?? '');
      if (!/^\d{9}$/.test(primarySsn)) return send(res, err(400, 'INVALID_SSN'));
      if (roles.some((r) => !(r in ALLOW))) return send(res, err(400, 'INVALID_ROLE'));
      const customerId = randomUUID();
      const applicationId = randomUUID();
      customers.set(customerId, { customerId, applicationId, utilizedDaily: 0, utilizedWeekly: 0 });
      const created: User[] = (['PRIMARY', ...roles] as Role[]).map((role, i) => ({
        userId: `u${randomUUID().slice(0, 8)}`,
        role,
        customerId,
        ssn: i === 0 ? primarySsn : `${100 + i}${String(Date.now()).slice(-6)}`,
      }));
      created.forEach((u) => users.set(u.userId, u));
      const accts: Account[] = [0, 1].map(() => ({ accountId: randomUUID(), customerId, balanceMinor: Number(json.openingDepositMinor ?? 100_000) }));
      accts.forEach((a) => accounts.set(a.accountId, a));
      return send(res, { status: 201, body: { applicationId, customerId, users: created.map(({ userId, role }) => ({ userId, role })), accounts: accts } });
    }
    const appDel = /^\/applications\/([\w-]+)$/.exec(p);
    if (appDel && req.method === 'DELETE') {
      const bad = appTokenOk(req, '/applications::delete');
      if (bad) return send(res, bad);
      const c = [...customers.values()].find((x) => x.applicationId === appDel[1]);
      if (!c) return send(res, err(404, 'APPLICATION_NOT_FOUND'));
      customers.delete(c.customerId);
      for (const [k, u] of users) if (u.customerId === c.customerId) users.delete(k);
      for (const [k, a] of accounts) if (a.customerId === c.customerId) accounts.delete(k);
      return send(res, { status: 204, body: undefined });
    }

    // function-API function call
    const fnMatch = /^\/api\/functions\/([\w.]+)$/.exec(p);
    if (fnMatch && req.method === 'POST') {
      const fn = FUNCTIONS[fnMatch[1] ?? ''];
      if (!fn) return send(res, err(404, 'FUNCTION_NOT_FOUND'));
      for (const h of ['x-correlation-id', 'x-user-id', 'x-user-role']) {
        if (!req.headers[h]) return send(res, err(400, 'MISSING_HEADER', h));
      }
      if (json.__invalid) return send(res, err(400, 'MALFORMED_JSON'));
      let user: User | undefined;
      if (fn.mode === 'service') {
        const bad = appTokenOk(req, fn.scope);
        if (bad) return send(res, bad);
      } else {
        const t = userTokens.get(bearer(req) ?? '');
        if (!t) return send(res, err(401, 'UNAUTHORIZED'));
        user = users.get(t.userId);
        if (!user) return send(res, err(401, 'UNAUTHORIZED'));
        if (!ALLOW[user.role].includes(fn.access) || (user.role === 'VIEW_ONLY' && VIEW_ONLY_DENY.has(fnMatch[1]!))) {
          return send(res, err(403, 'UNAUTHORIZED', `${user.role} cannot ${fn.access}`));
        }
        if (fn.access === 'money' && !t.elevated) return send(res, err(403, 'STEP_UP_REQUIRED'));
      }
      const idemKey = req.headers['idempotency-key'] as string | undefined;
      const isWrite = fnMatch[1]!.startsWith('Create');
      if (isWrite && fnMatch[1]!.includes('Transfer')) {
        if (!idemKey) return send(res, err(400, 'IDEMPOTENCY_KEY_REQUIRED'));
        const prior = idem.get(idemKey);
        if (prior) {
          if (prior.bodyHash !== raw) return send(res, err(422, 'IDEMPOTENCY_KEY_REUSED'));
          return send(res, { status: prior.status, body: prior.body }, { 'idempotent-replayed': 'true' });
        }
      }
      const out = fn.handler({ body: json, user, headers: req.headers, ...(idemKey ? { idemKey } : {}) });
      if (isWrite && idemKey && out.status < 500) idem.set(idemKey, { bodyHash: raw, status: out.status, body: out.body });
      return send(res, out);
    }
    send(res, err(404, 'NOT_FOUND', p));
  } catch (e) {
    send(res, err(500, 'MOCK_ERROR', String(e)));
  }
}).listen(PORT, () => console.log(`mock-bank listening on :${PORT}`));
