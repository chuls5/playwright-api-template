import type { ApiClient, ApiResponse, RequestOptions } from './api-client';

/** Versioned function name, e.g. `ReadTransactionLimits.v1`. It is the API id and the `@api:` tag. */
export type FunctionId = `${string}.v${number}`;

/**
 * function-API-style function call: one versioned name per operation, POST with a JSON body.
 * `pathFor` maps the id to a URL (target-defined).
 */
export class FunctionClient {
  private readonly api: ApiClient;
  private readonly pathFor: (fn: FunctionId) => string;
  constructor(api: ApiClient, pathFor: (fn: FunctionId) => string) {
    this.api = api;
    this.pathFor = pathFor;
  }

  call<T = unknown>(fn: FunctionId, body: unknown = {}, o: Omit<RequestOptions, 'data'> = {}): Promise<ApiResponse<T>> {
    return this.api.post<T>(this.pathFor(fn), { ...o, data: body });
  }
}
