import type { ApiClient } from '../../src';
import type { Order, Pet } from './schemas';

/** Typed endpoint wrappers. One method per operationId; no assertions here. */
export class PetstoreClient {
  private readonly api: ApiClient;
  constructor(api: ApiClient) {
    this.api = api;
  }
  addPet = (pet: Partial<Pet>) => this.api.post<Pet>('pet', { data: pet });
  updatePet = (pet: Partial<Pet>) => this.api.put<Pet>('pet', { data: pet });
  getPetById = (id: number | string) => this.api.get<Pet>(`pet/${id}`);
  deletePet = (id: number | string) => this.api.delete(`pet/${id}`);
  findPetsByStatus = (status: string) => this.api.get<Pet[]>('pet/findByStatus', { query: { status } });
  placeOrder = (order: Partial<Order>) => this.api.post<Order>('store/order', { data: order });
  getOrderById = (id: number | string) => this.api.get<Order>(`store/order/${id}`);
  deleteOrder = (id: number | string) => this.api.delete(`store/order/${id}`);
  getInventory = () => this.api.get<Record<string, number>>('store/inventory');
  loginUser = (username: string, password: string) => this.api.get<string>('user/login', { query: { username, password } });
  logoutUser = () => this.api.get('user/logout');
  /** Raw access for negative tests (malformed bodies, wrong content types). */
  raw = () => this.api;
}
