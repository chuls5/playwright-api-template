import type { TokenCache } from '../../src';
import { hmacService, staticOtp, userSessionMfa, type AuthStrategy, type OtpProvider } from '../../src';
import { cfg } from './config';

/** service identity per domain: clientId/secret from env + the scopes that domain is allowed to request. */
export const DOMAINS = {
  core: {
    clientId: cfg.MOCK_BANK_CORE_CLIENT_ID,
    secret: cfg.MOCK_BANK_CORE_SECRET,
    scopes: ['function:/GetNextBusinessDay.v1', 'function:/ReadCustomer.v1'],
  },
  onboarding: {
    clientId: cfg.MOCK_BANK_ONBOARDING_CLIENT_ID,
    secret: cfg.MOCK_BANK_ONBOARDING_SECRET,
    scopes: ['/applications::post', '/applications::delete'],
  },
  limits: { clientId: cfg.MOCK_BANK_LIMITS_CLIENT_ID, secret: cfg.MOCK_BANK_LIMITS_SECRET, scopes: ['function:/ReadTransactionLimits.v2'] },
  payments: {
    clientId: cfg.MOCK_BANK_PAYMENTS_CLIENT_ID,
    secret: cfg.MOCK_BANK_PAYMENTS_SECRET,
    scopes: ['function:/CreateScheduledTransfer.v1'],
  },
  servicing: {
    clientId: cfg.MOCK_BANK_SERVICING_CLIENT_ID,
    secret: cfg.MOCK_BANK_SERVICING_SECRET,
    scopes: ['function:/CreateAccountHold.v1', 'function:/ReadAccountHolds.v1', 'function:/DeleteAccountHold.v1'],
  },
} as const;
export type Domain = keyof typeof DOMAINS;

export const ROLES = ['PRIMARY', 'JOINT_OWNER', 'POWER_OF_ATTORNEY', 'VIEW_ONLY'] as const;
export type Role = (typeof ROLES)[number];

export const CHALLENGE_ENDPOINTS = ['/authentication/challenges/v3', '/authentication/challenges/v2', '/authentication/challenges/v1'] as const;

export function service(domain: Domain, cache: TokenCache, scopes?: readonly string[]): AuthStrategy {
  const d = DOMAINS[domain];
  return hmacService({ identity: domain, clientId: d.clientId, secret: d.secret, scopes: scopes ?? d.scopes, tokenUrl: cfg.MOCK_BANK_TOKEN_URL, cache });
}

export function user(u: { userId: string; role: string }, cache: TokenCache, o: { otp?: OtpProvider; challenges?: readonly string[] } = {}): AuthStrategy {
  return userSessionMfa({
    identity: `${u.role}:${u.userId}`,
    userId: u.userId,
    password: cfg.MOCK_BANK_PASSWORD,
    otp: o.otp ?? staticOtp(cfg.MOCK_BANK_OTP),
    cache,
    endpoints: { logon: '/auth/login', challenges: o.challenges ?? CHALLENGE_ENDPOINTS, deliver: '/otp/delivery/v3', answer: '/authentication/token/v3' },
  });
}
