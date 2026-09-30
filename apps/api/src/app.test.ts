import type { ApiError, Hero } from '@hero-factory/contracts';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { HeroEntity, HeroRepository } from './domain/hero.js';
import { buildApp } from './app.js';

const persistedHero: HeroEntity = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Luna Valente',
  nickname: 'Aurora',
  dateOfBirth: new Date('1992-05-14T00:00:00.000Z'),
  universe: 'Horizonte Solar',
  mainPower: 'Manipulação de luz',
  avatarUrl: 'https://example.com/aurora.png',
  isActive: true,
  createdAt: new Date('2026-01-01T10:00:00.000Z'),
  updatedAt: new Date('2026-01-01T10:00:00.000Z'),
};

const validPayload = {
  name: 'Luna Valente',
  nickname: 'Aurora',
  date_of_birth: '1992-05-14',
  universe: 'Horizonte Solar',
  main_power: 'Manipulação de luz',
  avatar_url: 'https://example.com/aurora.png',
};

describe('HTTP app', () => {
  let app: FastifyInstance;
  let databaseAvailable = true;
  const list = vi.fn(() => Promise.resolve({ heroes: [] as HeroEntity[], total: 0 }));
  const findById = vi.fn(() => Promise.resolve<HeroEntity | null>(null));
  const create = vi.fn(() => Promise.resolve(persistedHero));
  const updateIfActive = vi.fn(() => Promise.resolve<HeroEntity | null>(null));
  const setActive = vi.fn(() => Promise.resolve<HeroEntity | null>(null));
  const repository: HeroRepository = {
    list,
    findById,
    create,
    updateIfActive,
    setActive,
  };

  beforeAll(async () => {
    app = await buildApp({
      repository,
      healthCheck: () =>
        databaseAvailable ? Promise.resolve() : Promise.reject(new Error('database unavailable')),
      logger: false,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the healthcheck and OpenAPI document', async () => {
    const health = await app.inject({ method: 'GET', url: '/health' });
    const documentation = await app.inject({ method: 'GET', url: '/docs/json' });

    expect(health.json()).toEqual({ status: 'ok' });
    expect(documentation.statusCode).toBe(200);
    expect(documentation.json<{ paths: Record<string, unknown> }>().paths).toHaveProperty(
      '/api/heroes',
    );
  });

  it('reports when the database is unavailable', async () => {
    databaseAvailable = false;

    try {
      const health = await app.inject({ method: 'GET', url: '/health' });

      expect(health.statusCode).toBe(503);
      expect(health.json()).toEqual({ status: 'unavailable' });
    } finally {
      databaseAvailable = true;
    }
  });

  it('uses the default health check when a repository is supplied', async () => {
    const appWithDefaultHealthCheck = await buildApp({ repository, logger: false });

    try {
      const health = await appWithDefaultHealthCheck.inject({ method: 'GET', url: '/health' });

      expect(health.statusCode).toBe(200);
      expect(health.json()).toEqual({ status: 'ok' });
    } finally {
      await appWithDefaultHealthCheck.close();
    }
  });

  it('normalizes valid input through the shared contract', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/heroes',
      payload: {
        ...validPayload,
        name: '  Luna Valente  ',
        nickname: '  Aurora  ',
        universe: '  Horizonte Solar  ',
        main_power: '  Manipulação de luz  ',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json<Hero>().name).toBe('Luna Valente');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Luna Valente' }));
  });

  it('returns the standard error envelope for invalid input', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/heroes',
      payload: { name: '' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiError>().error.code).toBe('VALIDATION_ERROR');
  });

  it('normalizes malformed JSON errors returned by Fastify', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/heroes',
      headers: { 'content-type': 'application/json' },
      payload: '{"name":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiError>().error.code).toBe('REQUEST_ERROR');
  });

  it('serves the complete hero lifecycle through the HTTP routes', async () => {
    const updatedHero = { ...persistedHero, nickname: 'Nova Aurora' };
    const inactiveHero = { ...updatedHero, isActive: false };

    list.mockResolvedValueOnce({ heroes: [persistedHero], total: 1 });
    findById.mockResolvedValueOnce(persistedHero);
    updateIfActive.mockResolvedValueOnce(updatedHero);
    setActive.mockResolvedValueOnce(inactiveHero).mockResolvedValueOnce(updatedHero);

    const collection = await app.inject({
      method: 'GET',
      url: '/api/heroes?page=1&search=Aurora',
    });
    const details = await app.inject({ method: 'GET', url: `/api/heroes/${persistedHero.id}` });
    const update = await app.inject({
      method: 'PUT',
      url: `/api/heroes/${persistedHero.id}`,
      payload: { ...validPayload, nickname: 'Nova Aurora' },
    });
    const deactivate = await app.inject({
      method: 'DELETE',
      url: `/api/heroes/${persistedHero.id}`,
    });
    const reactivate = await app.inject({
      method: 'PATCH',
      url: `/api/heroes/${persistedHero.id}/status`,
      payload: { is_active: true },
    });

    expect(collection.json<{ data: Hero[]; pagination: { total: number } }>()).toMatchObject({
      data: [{ nickname: 'Aurora' }],
      pagination: { total: 1 },
    });
    expect(details.json<Hero>().id).toBe(persistedHero.id);
    expect(update.json<Hero>().nickname).toBe('Nova Aurora');
    expect(deactivate.json<Hero>().is_active).toBe(false);
    expect(reactivate.json<Hero>().is_active).toBe(true);
  });

  it('returns the standard envelopes for missing routes and heroes', async () => {
    const missingRoute = await app.inject({ method: 'GET', url: '/missing-route' });
    const missingHero = await app.inject({
      method: 'GET',
      url: `/api/heroes/${persistedHero.id}`,
    });

    expect(missingRoute.statusCode).toBe(404);
    expect(missingRoute.json<ApiError>().error.code).toBe('ROUTE_NOT_FOUND');
    expect(missingHero.statusCode).toBe(404);
    expect(missingHero.json<ApiError>().error.code).toBe('HERO_NOT_FOUND');
  });

  it('hides unexpected repository errors behind the standard envelope', async () => {
    list.mockRejectedValueOnce('repository unavailable');

    const response = await app.inject({ method: 'GET', url: '/api/heroes' });

    expect(response.statusCode).toBe(500);
    expect(response.json<ApiError>().error.code).toBe('INTERNAL_ERROR');
  });
});
