import { z } from 'zod';

export const HEROES_PER_PAGE = 10;

const requiredText = z
  .string()
  .trim()
  .min(1, 'Campo obrigatório')
  .max(255, 'Máximo de 255 caracteres');

const dateInputSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    if (year === undefined || month === undefined || day === undefined) return false;
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, 'Informe uma data válida');

const sqlDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, 'Data e hora inválidas');

const avatarUrlSchema = z
  .string()
  .trim()
  .max(2048, 'Máximo de 2048 caracteres')
  .url('Informe uma URL válida')
  .refine((value) => /^https?:\/\//i.test(value), {
    message: 'Use uma URL HTTP ou HTTPS',
  });

export const heroInputSchema = z
  .object({
    name: requiredText,
    nickname: requiredText,
    date_of_birth: dateInputSchema,
    universe: requiredText,
    main_power: requiredText,
    avatar_url: avatarUrlSchema,
  })
  .strict();

export const heroStatusInputSchema = z
  .object({
    is_active: z.boolean(),
  })
  .strict();

export const heroSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  nickname: z.string(),
  date_of_birth: sqlDateTimeSchema,
  universe: z.string(),
  main_power: z.string(),
  avatar_url: z.string().url(),
  is_active: z.boolean(),
  created_at: sqlDateTimeSchema,
  updated_at: sqlDateTimeSchema,
});

export const heroIdParamsSchema = z.object({
  id: z.string().uuid('Identificador inválido'),
});

export const heroListQuerySchema = z.object({
  page: z.coerce.number().int().positive('A página deve ser maior que zero').default(1),
  search: z.string().trim().max(100, 'Máximo de 100 caracteres').default(''),
});

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  per_page: z.literal(HEROES_PER_PAGE),
  total: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
});

export const heroListResponseSchema = z.object({
  data: z.array(heroSchema),
  pagination: paginationSchema,
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export type Hero = z.infer<typeof heroSchema>;
export type HeroInput = z.infer<typeof heroInputSchema>;
export type HeroStatusInput = z.infer<typeof heroStatusInputSchema>;
export type HeroListQuery = z.infer<typeof heroListQuerySchema>;
export type HeroListResponse = z.infer<typeof heroListResponseSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
