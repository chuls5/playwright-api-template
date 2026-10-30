import { randomUUID } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';
import { test } from '@playwright/test';
import { noAuth, type AuthStrategy } from '../auth/types';
import { attachJson } from '../reporting/allure';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface RequestOptions {
  query?: Record<string, string | number | boolean>;
  data?: unknown;
  form?: Record<string, string>;
  headers?: Record<string, string>;
  /** Sent as `Idempotency-Key`. Set once per logical operation; reused by retries. */
  idempotencyKey?: string;
  /** Override the client's auth for this call (e.g. `noAuth` for negative tests). */
  auth?: AuthStrategy;
}

export interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: T;
  text: string;
  durationMs: number;
  correlationId: string;
}

/** Adds headers per request (e.g. x-user-* headers). Target-defined. */
export type HeaderProvider = () => Record<string, string>;

export interface ApiClientOptions {
  auth?: AuthStrategy;
  headers?: HeaderProvider;
  correlationHeader?: string;
  /** Re-authenticate and resend once when a 401 comes back. Counted in Allure. Default true when auth is set. */
  reauthOn401?: boolean;
}

/**
 * Thin, typed wrapper over Playwright's APIRequestContext.
 * Never throws on 4xx/5xx; throws on transport errors. Retries nothing except one re-auth on 401.
 */
export class ApiClient {
  private readonly request: APIRequestContext;
  private readonly opts: ApiClientOptions;
  constructor(request: APIRequestContext, opts: ApiClientOptions = {}) {
    this.request = request;
    this.opts = opts;
  }

  /** Same transport, different identity. */
  as(auth: AuthStrategy): ApiClient {
    return new ApiClient(this.request, { ...this.opts, auth });
  }

  async send<T = unknown>(method: Method, path: string, o: RequestOptions = {}): Promise<ApiResponse<T>> {
    const auth = o.auth ?? this.opts.auth ?? noAuth;
    const first = await this.once<T>(method, path, o, auth);
    if (first.status === 401 && auth !== noAuth && (this.opts.reauthOn401 ?? true) && !o.auth) {
      auth.invalidate();
      test.info().annotations.push({ type: 'reauth', description: `${method} ${path} re-authenticated after 401` });
      return this.once<T>(method, path, o, auth);
    }
    return first;
  }

  get<T = unknown>(path: string, o?: RequestOptions) {
    return this.send<T>('GET', path, o);
  }
  post<T = unknown>(path: string, o?: RequestOptions) {
    return this.send<T>('POST', path, o);
  }
  put<T = unknown>(path: string, o?: RequestOptions) {
    return this.send<T>('PUT', path, o);
  }
  patch<T = unknown>(path: string, o?: RequestOptions) {
    return this.send<T>('PATCH', path, o);
  }
  delete<T = unknown>(path: string, o?: RequestOptions) {
    return this.send<T>('DELETE', path, o);
  }

  private async once<T>(method: Method, path: string, o: RequestOptions, auth: AuthStrategy): Promise<ApiResponse<T>> {
    const correlationId = randomUUID();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      [this.opts.correlationHeader ?? 'x-correlation-id']: correlationId,
      ...(this.opts.headers?.() ?? {}),
      ...(await auth.headers(this.request)),
      ...(o.idempotencyKey ? { 'Idempotency-Key': o.idempotencyKey } : {}),
      ...(o.headers ?? {}),
    };
    const started = Date.now();
    const res = await this.request.fetch(path, {
      method,
      headers,
      ...(o.query ? { params: o.query } : {}),
      ...(o.data !== undefined ? { data: o.data } : {}),
      ...(o.form ? { form: o.form } : {}),
      failOnStatusCode: false,
    });
    const durationMs = Date.now() - started;
    const text = await res.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      /* non-JSON body stays text */
    }
    const out: ApiResponse<T> = { status: res.status(), ok: res.ok(), headers: res.headers(), body: body as T, text, durationMs, correlationId };
    await attachJson(`${method} ${path} → ${out.status}`, {
      request: { method, url: res.url(), headers, query: o.query, data: o.data, form: o.form },
      response: { status: out.status, durationMs, headers: out.headers, body },
      correlationId,
    });
    return out;
  }
}
