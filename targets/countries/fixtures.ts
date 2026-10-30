import { ApiClient, test as base } from '../../src';
import { CountriesClient } from './client';

/** Read-only public API: no auth, no data to create or clean up. */
export const test = base.extend<{ countries: CountriesClient }>({
  countries: async ({ request }, use) => use(new CountriesClient(new ApiClient(request))),
});
export { expect } from '../../src';
