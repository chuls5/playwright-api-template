import type { ApiClient } from '../../src';
import type { Cart, Invoice, Product } from './schemas';

export interface InvoiceRequest {
  billing_street: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_postal_code: string;
  payment_method: 'bank-transfer' | 'cash-on-delivery' | 'credit-card' | 'buy-now-pay-later' | 'gift-card';
  payment_details: Record<string, unknown>;
  cart_id: string;
}

/** One method per operationId (spec/openapi.json). No assertions, no data creation. */
export class ToolshopClient {
  private readonly api: ApiClient;
  constructor(api: ApiClient) {
    this.api = api;
  }
  // products & catalogue
  getProducts = (query: Record<string, string | number> = {}) => this.api.get<{ data: Product[]; last_page: number; total: number }>('products', { query });
  getProduct = (id: string) => this.api.get<Product>(`products/${id}`);
  searchProduct = (q: string) => this.api.get<{ data: Product[] }>('products/search', { query: { q } });
  getBrands = () => this.api.get<unknown[]>('brands');
  searchBrand = (q?: string) => this.api.get<unknown[]>('brands/search', q === undefined ? {} : { query: { q } });
  getBrand = (id: string) => this.api.get<unknown>(`brands/${id}`);
  getCategories = () => this.api.get<unknown[]>('categories');
  postcodeLookup = (country: string, postcode: string) =>
    this.api.get<{ street: string; city: string; state: string; country: string; postcode: string }>('postcode-lookup', { query: { country, postcode } });
  // users
  storeUser = (body: Record<string, unknown>) => this.api.post<{ id: string; email: string }>('users/register', { data: body });
  login = (email: string, password: string) => this.api.post<{ access_token: string; expires_in: number }>('users/login', { data: { email, password } });
  me = () => this.api.get<{ id: string; email: string }>('users/me');
  getUsers = () => this.api.get('users');
  deleteUser = (id: string) => this.api.delete(`users/${id}`);
  // carts
  createCart = () => this.api.post<{ id: string }>('carts');
  addItem = (cartId: string, product_id: string, quantity: number) => this.api.post(`carts/${cartId}`, { data: { product_id, quantity } });
  getCart = (cartId: string) => this.api.get<Cart>(`carts/${cartId}`);
  updateCartQuantity = (cartId: string, product_id: string, quantity: number) =>
    this.api.put(`carts/${cartId}/product/quantity`, { data: { product_id, quantity } });
  deleteProductFromCart = (cartId: string, productId: string) => this.api.delete(`carts/${cartId}/product/${productId}`);
  deleteCart = (cartId: string) => this.api.delete(`carts/${cartId}`);
  // invoices
  storeInvoice = (body: InvoiceRequest) => this.api.post<Invoice>('invoices', { data: body });
  getInvoices = (query: Record<string, string | number> = {}) => this.api.get<{ data: Invoice[] }>('invoices', { query });
  getInvoice = (id: string) => this.api.get<Invoice>(`invoices/${id}`);
  /** Raw access for negative tests. */
  raw = () => this.api;
}
