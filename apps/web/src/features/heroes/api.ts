import {
  heroListResponseSchema,
  heroSchema,
  type HeroInput,
  type HeroListResponse,
  type Hero,
} from '@hero-factory/contracts';

import { apiRequest } from '@/api/http';

export const heroKeys = {
  all: ['heroes'] as const,
  list: (page: number, search: string) => [...heroKeys.all, 'list', { page, search }] as const,
  detail: (id: string) => [...heroKeys.all, 'detail', id] as const,
};

export function listHeroes(
  { page, search }: { page: number; search: string },
  signal?: AbortSignal,
): Promise<HeroListResponse> {
  const query = new URLSearchParams({ page: String(page) });
  if (search) query.set('search', search);

  return apiRequest(`/api/heroes?${query.toString()}`, heroListResponseSchema, {
    ...(signal ? { signal } : {}),
  });
}

export function getHero(id: string, signal?: AbortSignal): Promise<Hero> {
  return apiRequest(`/api/heroes/${id}`, heroSchema, { ...(signal ? { signal } : {}) });
}

export function createHero(input: HeroInput): Promise<Hero> {
  return apiRequest('/api/heroes', heroSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateHero({ id, input }: { id: string; input: HeroInput }): Promise<Hero> {
  return apiRequest(`/api/heroes/${id}`, heroSchema, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deactivateHero(id: string): Promise<Hero> {
  return apiRequest(`/api/heroes/${id}`, heroSchema, { method: 'DELETE' });
}

export function setHeroStatus({ id, isActive }: { id: string; isActive: boolean }): Promise<Hero> {
  return apiRequest(`/api/heroes/${id}/status`, heroSchema, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}
