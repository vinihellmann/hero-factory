import {
  apiErrorSchema,
  heroIdParamsSchema,
  heroInputSchema,
  heroListQuerySchema,
  heroListResponseSchema,
  heroSchema,
  heroStatusInputSchema,
} from '@hero-factory/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import type { HeroService } from '../application/hero-service.js';
import { presentHero, presentHeroPage } from './hero-presenter.js';

export function registerHeroRoutes(app: FastifyInstance, service: HeroService): void {
  const routes = app.withTypeProvider<ZodTypeProvider>();

  routes.get('/api/heroes', {
    schema: {
      tags: ['Heróis'],
      summary: 'Lista e busca heróis',
      querystring: heroListQuerySchema,
      response: {
        200: heroListResponseSchema,
        400: apiErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const page = await service.list(request.query);
      return reply.send(presentHeroPage(page));
    },
  });

  routes.get('/api/heroes/:id', {
    schema: {
      tags: ['Heróis'],
      summary: 'Consulta um herói',
      params: heroIdParamsSchema,
      response: {
        200: heroSchema,
        400: apiErrorSchema,
        404: apiErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const hero = await service.getById(request.params.id);
      return reply.send(presentHero(hero));
    },
  });

  routes.post('/api/heroes', {
    schema: {
      tags: ['Heróis'],
      summary: 'Cria um herói',
      body: heroInputSchema,
      response: {
        201: heroSchema,
        400: apiErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const hero = await service.create(request.body);
      return reply.code(201).send(presentHero(hero));
    },
  });

  routes.put('/api/heroes/:id', {
    schema: {
      tags: ['Heróis'],
      summary: 'Edita os campos de um herói ativo',
      params: heroIdParamsSchema,
      body: heroInputSchema,
      response: {
        200: heroSchema,
        400: apiErrorSchema,
        404: apiErrorSchema,
        409: apiErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const hero = await service.update(request.params.id, request.body);
      return reply.send(presentHero(hero));
    },
  });

  routes.delete('/api/heroes/:id', {
    schema: {
      tags: ['Heróis'],
      summary: 'Inativa um herói',
      params: heroIdParamsSchema,
      response: {
        200: heroSchema,
        400: apiErrorSchema,
        404: apiErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const hero = await service.deactivate(request.params.id);
      return reply.send(presentHero(hero));
    },
  });

  routes.patch('/api/heroes/:id/status', {
    schema: {
      tags: ['Heróis'],
      summary: 'Ativa ou inativa um herói',
      params: heroIdParamsSchema,
      body: heroStatusInputSchema,
      response: {
        200: heroSchema,
        400: apiErrorSchema,
        404: apiErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const hero = await service.setStatus(request.params.id, request.body);
      return reply.send(presentHero(hero));
    },
  });
}
