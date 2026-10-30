import { expectSchema, expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';
import { Country, ok } from '../../schemas';
import { z } from 'zod';

test.describe('queries', { tag: '@L1' }, () => {
  test('country(code: "US") → data matches schema, no errors', { tag: ['@smoke', '@api:country'] }, async ({ countries }) => {
    const res = await countries.country('US');
    expectStatus(res, 200);
    const { data } = expectSchema(res, ok(z.object({ country: Country })));
    expect(data.country).toMatchObject({ code: 'US', continent: { code: 'NA' }, capital: 'Washington D.C.' });
  });

  test('countries(filter continent eq OC) → only Oceania', { tag: '@api:countries' }, async ({ countries }) => {
    const res = await countries.countriesOn('OC');
    expectStatus(res, 200);
    const { data } = expectSchema(res, ok(z.object({ countries: z.array(z.object({ code: z.string(), continent: z.object({ code: z.string() }) })).min(1) })));
    expect(new Set(data.countries.map((c) => c.continent.code))).toEqual(new Set(['OC']));
    expect(data.countries.map((c) => c.code)).toContain('AU');
  });

  test('continents → the 7 continent codes', { tag: '@api:continents' }, async ({ countries }) => {
    const res = await countries.continents();
    expectStatus(res, 200);
    const { data } = expectSchema(res, ok(z.object({ continents: z.array(z.object({ code: z.string(), name: z.string() })) })));
    expect(data.continents.map((c) => c.code).sort()).toEqual(['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA']);
  });
});
