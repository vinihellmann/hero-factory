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

describe('HTTP app', () => {
  let app: FastifyInstance;
  let databaseAvailable = true;
  const create = vi.fn(() => Promise.resolve(persistedHero));
  const repository: HeroRepository = {
    list: () => Promise.resolve({ heroes: [], total: 0 }),
    findById: () => Promise.resolve(null),
    create,
    updateIfActive: () => Promise.resolve(null),
    setActive: () => Promise.resolve(null),
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

  it('normalizes valid input through the shared contract', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/heroes',
      payload: {
        name: '  Luna Valente  ',
        nickname: '  Aurora  ',
        date_of_birth: '1992-05-14',
        universe: '  Horizonte Solar  ',
        main_power: '  Manipulação de luz  ',
        avatar_url: 'https://example.com/aurora.png',
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
});
