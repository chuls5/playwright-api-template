import { hmacV2Signature, hmacV2Signer, expectStatus } from '../../../../src';
import { cfg } from '../../config';
import { DOMAINS } from '../../identities';
import { expect, test } from '../../fixtures';

test.describe('service HMAC v2 token', { tag: ['@L0', '@api:service-token'] }, () => {
  test('signature matches the known-answer vector', { tag: '@smoke' }, async ({ raw }) => {
    // Fixed inputs → the mock computes the signature with an independent implementation.
    const kat = await raw.get<{ clientId: string; secret: string; ts: string; signature: string }>('/__kat');
    expectStatus(kat, 200);
    expect(hmacV2Signature(kat.body.clientId, kat.body.secret, Number(kat.body.ts))).toBe(kat.body.signature);
    expect(kat.body.signature).not.toMatch(/[+/=]/); // base64url, no padding
    // Pinned vector (computed with openssl): HMAC-SHA256(key 'kat-secret', 'kat-app:2:1700000000000'), base64url.
    expect(hmacV2Signature('kat-app', Buffer.from('kat-secret').toString('base64'), 1700000000000)).toBe('mfN1RFJYEpRcFjjEhcnxhjEKybf5jlv4JGc9ZJcXsuI');
  });

  for (const [domain, d] of Object.entries(DOMAINS)) {
    test(`${domain} identity mints a token for its scopes`, async ({ raw }) => {
      const res = await raw.post<{ authorization_token: string }>(cfg.MOCK_BANK_TOKEN_URL, {
        headers: hmacV2Signer({ clientId: d.clientId, secret: d.secret, nowMs: Date.now() }),
        data: { scope: [...d.scopes] },
      });
      expectStatus(res, 200);
      expect(res.body.authorization_token).toBeTruthy();
    });
  }

  test('scope outside the identity allowlist → 403 SCOPE_NOT_ALLOWED', async ({ raw }) => {
    const d = DOMAINS.core;
    const res = await raw.post(cfg.MOCK_BANK_TOKEN_URL, {
      headers: hmacV2Signer({ clientId: d.clientId, secret: d.secret, nowMs: Date.now() }),
      data: { scope: ['function:/CreateTransfer.v1'] },
    });
    expectStatus(res, 403);
    expect(res.body).toMatchObject({ code: 'SCOPE_NOT_ALLOWED' });
  });

  test('wrong secret → 401 BAD_SIGNATURE', async ({ raw }) => {
    const d = DOMAINS.core;
    const res = await raw.post(cfg.MOCK_BANK_TOKEN_URL, {
      headers: hmacV2Signer({ clientId: d.clientId, secret: Buffer.from('wrong').toString('base64'), nowMs: Date.now() }),
      data: { scope: [...d.scopes] },
    });
    expectStatus(res, 401);
    expect(res.body).toMatchObject({ code: 'BAD_SIGNATURE' });
  });

  test('timestamp outside skew window → 401 STALE_TIMESTAMP', async ({ raw }) => {
    const d = DOMAINS.core;
    const res = await raw.post(cfg.MOCK_BANK_TOKEN_URL, {
      headers: hmacV2Signer({ clientId: d.clientId, secret: d.secret, nowMs: Date.now() - 3_600_000 }),
      data: { scope: [...d.scopes] },
    });
    expectStatus(res, 401);
    expect(res.body).toMatchObject({ code: 'STALE_TIMESTAMP' });
  });

  test('unknown clientId → 401 UNKNOWN_APP', async ({ raw }) => {
    const res = await raw.post(cfg.MOCK_BANK_TOKEN_URL, {
      headers: hmacV2Signer({ clientId: 'nobody', secret: DOMAINS.core.secret, nowMs: Date.now() }),
      data: { scope: ['x'] },
    });
    expectStatus(res, 401);
  });
});
