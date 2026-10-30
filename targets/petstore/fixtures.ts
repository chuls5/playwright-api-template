import { ApiClient, test as base } from '../../src';
import { PetstoreClient } from './client';
import type { Pet } from './schemas';

interface PetstoreFixtures {
  petstore: PetstoreClient;
  /** Creates a pet owned by this test; deleted afterwards. Ids are random 9-digit to avoid shared-data collisions. */
  newPet: (overrides?: Partial<Pet>) => Promise<Pet>;
}

export const test = base.extend<PetstoreFixtures>({
  petstore: async ({ request }, use) => use(new PetstoreClient(new ApiClient(request))),
  newPet: async ({ petstore, rng, cleanup }, use) => {
    await use(async (overrides = {}) => {
      const pet: Pet = { id: rng.id(), name: `poc-${rng.letters(8)}`, photoUrls: [], status: 'available', ...overrides };
      const res = await petstore.addPet(pet);
      if (res.status !== 200) throw new Error(`setup: addPet failed HTTP ${res.status}`);
      cleanup.add({ type: 'pet', id: String(pet.id) }, () => petstore.deletePet(pet.id));
      return res.body;
    });
  },
});
export { expect } from '../../src';
