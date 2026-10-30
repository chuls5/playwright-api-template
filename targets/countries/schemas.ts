import { z } from 'zod';

/** Success envelope: data present, no `errors` key. */
export const ok = <T extends z.ZodType>(data: T) => z.object({ data, errors: z.never().optional() }).strict();
/** Error envelope: HTTP 200 with errors[]; `data` null or partial. */
export const GqlErrors = z.object({
  data: z.unknown().optional(),
  errors: z.array(z.object({ message: z.string(), extensions: z.object({ code: z.string() }).partial().passthrough().optional() }).passthrough()).min(1),
});

export const Country = z.object({
  code: z.string().length(2),
  name: z.string(),
  capital: z.string().nullable(),
  currency: z.string().nullable(),
  continent: z.object({ code: z.string().length(2) }),
  languages: z.array(z.object({ code: z.string() })),
});
