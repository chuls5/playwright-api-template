import { expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';

test.describe('getBrand not found', { tag: ['@L2', '@api:getBrand', '@pattern:not-found'] }, () => {
  test('GET /brands/{id} for an unknown ULID → 404 not-found message', async ({ toolshop }) => {
    const res = await toolshop.getBrand('0'.repeat(26));
    expectStatus(res, 404);
    expect(res.body).toEqual({ message: 'Requested item not found' });
  });
});
