import type { ApiClient } from '../../src';

export interface GqlError {
  message: string;
  extensions?: { code?: string };
}
export interface GqlBody<T> {
  data?: T | null;
  errors?: GqlError[];
}

/** One POST per operation; queries are constants, inputs always go in `variables`. */
export class CountriesClient {
  private readonly api: ApiClient;
  constructor(api: ApiClient) {
    this.api = api;
  }
  gql = <T>(query: string, variables: Record<string, unknown> = {}) => this.api.post<GqlBody<T>>('graphql', { data: { query, variables } });

  country = (code: string) =>
    this.gql<{
      country: {
        code: string;
        name: string;
        capital: string | null;
        currency: string | null;
        continent: { code: string };
        languages: { code: string }[];
      } | null;
    }>('query Country($code: ID!) { country(code: $code) { code name capital currency continent { code } languages { code } } }', { code });
  countriesOn = (continent: string) =>
    this.gql<{ countries: { code: string; continent: { code: string } }[] }>(
      'query ByContinent($c: String!) { countries(filter: { continent: { eq: $c } }) { code continent { code } } }',
      { c: continent },
    );
  continents = () => this.gql<{ continents: { code: string; name: string }[] }>('query { continents { code name } }');
}
