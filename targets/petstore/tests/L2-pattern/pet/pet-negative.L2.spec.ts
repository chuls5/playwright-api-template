import { expectSchema, expectStatus } from '../../../../../src';
import { ApiError } from '../../../schemas';
import { expect, test } from '../../../fixtures';

test.describe('pet negative', { tag: ['@L2', '@pattern:validation'] }, () => {
  test('GET /pet/{id} with non-numeric id → 400 input error', { tag: '@api:getPetById' }, async ({ petstore }) => {
    const res = await petstore.getPetById('abc');
    expectStatus(res, 400);
    expect(expectSchema(res, ApiError).message).toMatch(/convert/i);
  });

  test('GET /pet/{id} for unknown id → 404', { tag: '@api:getPetById' }, async ({ petstore }) => {
    // 12-digit ids are outside what our factories (and most users) create.
    expectStatus(await petstore.getPetById(987_654_321_012), 404);
  });

  test('GET /pet/findByStatus with value outside enum → 400', { tag: '@api:findPetsByStatus' }, async ({ petstore }) => {
    const res = await petstore.findPetsByStatus('bogus');
    expectStatus(res, 400);
    expect(expectSchema(res, ApiError).message).toMatch(/allowable values/i);
  });

  test('POST /pet with malformed JSON → 400', { tag: '@api:addPet' }, async ({ petstore }) => {
    const res = await petstore.raw().post('pet', { data: '{bad', headers: { 'Content-Type': 'application/json' } });
    expectStatus(res, 400);
  });

  for (const status of ['available', 'pending', 'sold'] as const) {
    test(`POST /pet with status=${status} → 200 status kept`, { tag: ['@api:addPet', '@pattern:enum'] }, async ({ newPet }) => {
      expect((await newPet({ status })).status).toBe(status);
    });
  }
});
