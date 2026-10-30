import { expectFasterThan, expectSchema, expectStatus } from '../../../../../src';
import { expect, test } from '../../../fixtures';
import { Pet } from '../../../schemas';

test.describe('pet CRUD', { tag: '@L1' }, () => {
  test('POST /pet with valid pet → 200 and echoes the pet', { tag: ['@smoke', '@api:addPet'] }, async ({ petstore, rng, cleanup }) => {
    const pet = { id: rng.id(), name: `poc-${rng.letters(8)}`, photoUrls: ['https://example.test/p.png'], status: 'available' as const };
    const res = await petstore.addPet(pet);
    cleanup.add({ type: 'pet', id: String(pet.id) }, () => petstore.deletePet(pet.id));
    expectStatus(res, 200);
    const body = expectSchema(res, Pet);
    expect(body).toMatchObject(pet);
    expectFasterThan(res, 5_000);
  });

  test('GET /pet/{id} for own pet → 200 matching schema', { tag: ['@smoke', '@api:getPetById'] }, async ({ petstore, newPet }) => {
    const pet = await newPet();
    const res = await petstore.getPetById(pet.id);
    expectStatus(res, 200);
    expect(expectSchema(res, Pet)).toMatchObject({ id: pet.id, name: pet.name });
  });

  test('PUT /pet changing status → 200 and status persisted', { tag: '@api:updatePet' }, async ({ petstore, newPet }) => {
    const pet = await newPet();
    const res = await petstore.updatePet({ ...pet, status: 'sold' });
    expectStatus(res, 200);
    expect(expectSchema(res, Pet).status).toBe('sold');
    // Shared public server: read-after-write is usually but not always consistent.
    await expect.poll(async () => (await petstore.getPetById(pet.id)).body.status).toBe('sold');
  });

  test('DELETE /pet/{id} → 200, then GET → 404', { tag: '@api:deletePet' }, async ({ petstore, newPet }) => {
    const pet = await newPet();
    expectStatus(await petstore.deletePet(pet.id), 200);
    await expect.poll(async () => (await petstore.getPetById(pet.id)).status).toBe(404);
  });

  test('GET /pet/findByStatus?status=available → 200 array of pets', { tag: '@api:findPetsByStatus' }, async ({ petstore }) => {
    const res = await petstore.findPetsByStatus('available');
    expectStatus(res, 200);
    expect(Array.isArray(res.body)).toBe(true);
    // Shared data contains junk written by other users; validate shape of the first item only.
    if (res.body.length) expect(Pet.safeParse(res.body[0]).success).toBe(true);
  });
});
