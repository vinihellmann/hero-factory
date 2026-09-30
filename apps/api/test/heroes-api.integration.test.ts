import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import type { ApiError, Hero, HeroInput, HeroListResponse } from '@hero-factory/contracts';
import { MySqlContainer } from '@testcontainers/mysql';
import type { StartedMySqlContainer } from '@testcontainers/mysql';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { createPrismaClient } from '../src/database/prisma.js';
import { PrismaHeroRepository } from '../src/infrastructure/prisma-hero-repository.js';

const execFileAsync = promisify(execFile);

const heroInput: HeroInput = {
  name: '  Luna Valente  ',
  nickname: '  Aurora  ',
  date_of_birth: '1992-05-14',
  universe: '  Horizonte Solar  ',
  main_power: '  Manipulação de luz  ',
  avatar_url: 'https://example.com/aurora.png',
};

describe('Heroes API with MySQL', () => {
  let container: StartedMySqlContainer;
  let prisma: ReturnType<typeof createPrismaClient>;
  let app: FastifyInstance;

  beforeAll(async () => {
    container = await new MySqlContainer('mysql:8.4')
      .withDatabase('hero_factory_test')
      .withUsername('hero_user')
      .withUserPassword('hero_password')
      .start();

    const databaseUrl = container.getConnectionUri();
    const prismaCli = resolve(import.meta.dirname, '../../../node_modules/prisma/build/index.js');
    await execFileAsync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
      cwd: resolve(import.meta.dirname, '..'),
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });

    prisma = createPrismaClient(databaseUrl);
    app = await buildApp({
      repository: new PrismaHeroRepository(prisma),
      healthCheck: async () => void (await prisma.$queryRawUnsafe('SELECT 1')),
      logger: false,
      webOrigin: 'http://localhost:5173',
    });
    await app.ready();
  });

  beforeEach(async () => {
    await prisma.hero.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
    await container?.stop();
  });

  it('exposes health and generated OpenAPI documentation', async () => {
    const health = await app.inject({ method: 'GET', url: '/health' });
    const specification = await app.inject({ method: 'GET', url: '/docs/json' });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: 'ok' });
    expect(specification.statusCode).toBe(200);
    const openApi = specification.json<{
      info: { title: string; version: string };
      paths: Record<string, unknown>;
    }>();
    expect(openApi.info).toMatchObject({ title: 'Hero Factory API', version: '1.0.0' });
    expect(openApi.paths).toHaveProperty('/api/heroes');
  });

  it('runs the create, read, update, deactivate and reactivate flow', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/heroes',
      payload: heroInput,
    });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json<Hero>();
    expect(created).toMatchObject({
      name: 'Luna Valente',
      nickname: 'Aurora',
      date_of_birth: '1992-05-14 00:00:00',
      is_active: true,
    });

    const getResponse = await app.inject({ method: 'GET', url: `/api/heroes/${created.id}` });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json<Hero>().id).toBe(created.id);

    const updateResponse = await app.inject({
      method: 'PUT',
      url: `/api/heroes/${created.id}`,
      payload: { ...heroInput, nickname: 'Nova Aurora' },
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json<Hero>().nickname).toBe('Nova Aurora');

    const deleteResponse = await app.inject({ method: 'DELETE', url: `/api/heroes/${created.id}` });
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.json<Hero>().is_active).toBe(false);

    const repeatedDelete = await app.inject({ method: 'DELETE', url: `/api/heroes/${created.id}` });
    expect(repeatedDelete.statusCode).toBe(200);
    expect(repeatedDelete.json<Hero>().updated_at).toBe(deleteResponse.json<Hero>().updated_at);

    const blockedUpdate = await app.inject({
      method: 'PUT',
      url: `/api/heroes/${created.id}`,
      payload: { ...heroInput, nickname: 'Não permitido' },
    });
    expect(blockedUpdate.statusCode).toBe(409);
    expect(blockedUpdate.json()).toMatchObject({ error: { code: 'HERO_INACTIVE' } });

    const activateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/heroes/${created.id}/status`,
      payload: { is_active: true },
    });
    expect(activateResponse.statusCode).toBe(200);
    expect(activateResponse.json<Hero>().is_active).toBe(true);
  });

  it('keeps concurrent status changes idempotent', async () => {
    const hero = await prisma.hero.create({
      data: {
        name: 'Luna Valente',
        nickname: 'Aurora',
        dateOfBirth: new Date('1992-05-14T00:00:00.000Z'),
        universe: 'Horizonte Solar',
        mainPower: 'Manipulacao de luz',
        avatarUrl: 'https://example.com/aurora.png',
      },
    });
    const repository = new PrismaHeroRepository(prisma);

    const deactivated = await Promise.all(
      Array.from({ length: 5 }, () => repository.setActive(hero.id, false)),
    );
    const updatedAt = deactivated[0]?.updatedAt;
    const repeated = await Promise.all(
      Array.from({ length: 5 }, () => repository.setActive(hero.id, false)),
    );

    expect(deactivated.map((result) => result?.isActive)).toEqual(Array(5).fill(false));
    expect(repeated.map((result) => result?.isActive)).toEqual(Array(5).fill(false));
    expect(repeated.every((result) => result?.updatedAt.getTime() === updatedAt?.getTime())).toBe(
      true,
    );
  });

  it('paginates, orders and searches without case or accent differences', async () => {
    await prisma.hero.createMany({
      data: Array.from({ length: 11 }, (_, index) => ({
        id: `20000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
        name: index === 0 ? 'Álvaro Estelar' : `Herói ${index}`,
        nickname: index === 0 ? 'Raio Azul' : `Codinome ${index}`,
        dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
        universe: 'Universo de teste',
        mainPower: 'Poder de teste',
        avatarUrl: `https://example.com/hero-${index}.png`,
        isActive: true,
        createdAt: new Date(Date.UTC(2026, 0, index + 1)),
        updatedAt: new Date(Date.UTC(2026, 0, index + 1)),
      })),
    });

    const firstPageResponse = await app.inject({ method: 'GET', url: '/api/heroes?page=1' });
    const secondPageResponse = await app.inject({ method: 'GET', url: '/api/heroes?page=2' });
    const searchResponse = await app.inject({
      method: 'GET',
      url: '/api/heroes?page=1&search=alvaro',
    });
    const nicknameSearchResponse = await app.inject({
      method: 'GET',
      url: '/api/heroes?page=1&search=raio',
    });

    const firstPage = firstPageResponse.json<HeroListResponse>();
    const secondPage = secondPageResponse.json<HeroListResponse>();
    const search = searchResponse.json<HeroListResponse>();
    const nicknameSearch = nicknameSearchResponse.json<HeroListResponse>();

    expect(firstPage.data).toHaveLength(10);
    expect(firstPage.pagination).toEqual({ page: 1, per_page: 10, total: 11, total_pages: 2 });
    expect(firstPage.data[0]?.nickname).toBe('Codinome 10');
    expect(secondPage.data).toHaveLength(1);
    expect(search.data).toHaveLength(1);
    expect(search.data[0]?.name).toBe('Álvaro Estelar');
    expect(nicknameSearch.data).toHaveLength(1);
    expect(nicknameSearch.data[0]?.nickname).toBe('Raio Azul');
  });

  it('returns consistent validation and not-found errors', async () => {
    const invalidBody = await app.inject({
      method: 'POST',
      url: '/api/heroes',
      payload: { ...heroInput, name: '', avatar_url: 'ftp://example.com/avatar.png' },
    });
    const invalidId = await app.inject({ method: 'GET', url: '/api/heroes/not-a-uuid' });
    const missingId = await app.inject({
      method: 'GET',
      url: '/api/heroes/30000000-0000-4000-8000-000000000001',
    });

    expect(invalidBody.statusCode).toBe(400);
    const invalidBodyError = invalidBody.json<ApiError>();
    expect(invalidBodyError.error.code).toBe('VALIDATION_ERROR');
    expect(invalidBodyError.error.fields).toBeDefined();
    expect(invalidId.statusCode).toBe(400);
    expect(invalidId.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
    expect(missingId.statusCode).toBe(404);
    expect(missingId.json()).toMatchObject({ error: { code: 'HERO_NOT_FOUND' } });
  });
});
