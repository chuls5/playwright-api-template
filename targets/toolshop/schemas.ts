import { z } from 'zod';

/** Laravel paginator envelope. */
export const page = <T extends z.ZodType>(item: T) =>
  z.object({
    current_page: z.number().int(),
    data: z.array(item),
    from: z.number().int().nullable(),
    to: z.number().int().nullable(),
    last_page: z.number().int(),
    per_page: z.number().int(),
    total: z.number().int(),
  });

export const Product = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  in_stock: z.boolean(),
  is_rental: z.boolean(),
  category: z.object({ id: z.string(), name: z.string() }).optional(),
  brand: z.object({ id: z.string(), name: z.string() }).optional(),
});
export type Product = z.infer<typeof Product>;
export const ProductPage = page(Product);

export const Brand = z.object({ id: z.string(), name: z.string(), slug: z.string() });
export const Category = z.object({ id: z.string(), name: z.string(), slug: z.string() });

export const Token = z.object({ access_token: z.string(), token_type: z.string(), expires_in: z.number().int() });

export const User = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
});

export const CartItem = z.object({ id: z.string(), quantity: z.number().int(), product_id: z.string(), product: Product.partial().optional() });
export const Cart = z.object({ id: z.string(), cart_items: z.array(CartItem) });
export type Cart = z.infer<typeof Cart>;

export const Address = z.object({ street: z.string(), city: z.string(), state: z.string(), country: z.string(), postcode: z.string() });

export const Invoice = z.object({
  id: z.string(),
  invoice_number: z.string().regex(/^INV-\d+$/),
  user_id: z.string(),
  billing_city: z.string(),
  billing_country: z.string(),
  total: z.number().nonnegative(),
});
export type Invoice = z.infer<typeof Invoice>;
export const InvoicePage = page(Invoice.partial({ total: true }).passthrough());

/** Laravel validation error: `{ field: [messages] }`, sometimes wrapped as `{ message, errors }`. */
export const ValidationErrors = z.record(z.string(), z.unknown());
