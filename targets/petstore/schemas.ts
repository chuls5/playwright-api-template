import { z } from 'zod';

export const Pet = z.object({
  id: z.number().int(),
  name: z.string(),
  photoUrls: z.array(z.string()),
  status: z.enum(['available', 'pending', 'sold']).optional(),
  category: z.object({ id: z.number().int().optional(), name: z.string().optional() }).optional(),
  tags: z.array(z.object({ id: z.number().int().optional(), name: z.string().optional() })).optional(),
});
export type Pet = z.infer<typeof Pet>;

export const Order = z.object({
  id: z.number().int(),
  petId: z.number().int(),
  quantity: z.number().int(),
  shipDate: z.string().optional(),
  status: z.enum(['placed', 'approved', 'delivered']).optional(),
  complete: z.boolean(),
});
export type Order = z.infer<typeof Order>;

export const ApiError = z.object({ code: z.number().int(), message: z.string() });
export const Inventory = z.record(z.string(), z.number().int());
