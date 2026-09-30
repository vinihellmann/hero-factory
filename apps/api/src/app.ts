import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { z } from 'zod';

import { HeroService } from './application/hero-service.js';
import { createPrismaClient } from './database/prisma.js';
import type { HeroRepository } from './domain/hero.js';
import { registerErrorHandlers } from './http/error-handler.js';
import { registerHeroRoutes } from './http/hero-routes.js';
import { PrismaHeroRepository } from './infrastructure/prisma-hero-repository.js';

export interface BuildAppOptions {
  repository?: HeroRepository;
  databaseUrl?: string;
  healthCheck?: () => Promise<void>;
  webOrigin?: string;
  logger?: boolean;
}

const healthResponseSchema = z.object({ status: z.literal('ok') });
const unavailableHealthResponseSchema = z.object({ status: z.literal('unavailable') });

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, {
    origin: options.webOrigin ?? 'http://localhost:5173',
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Hero Factory API',
        description: 'API REST para cadastro e gerenciamento de heróis.',
        version: '1.0.0',
      },
      tags: [{ name: 'Heróis', description: 'Operações do catálogo de heróis' }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });

  let repository = options.repository;
  let healthCheck = options.healthCheck ?? (() => Promise.resolve());
  if (repository === undefined) {
    const prisma = createPrismaClient(options.databaseUrl);
    repository = new PrismaHeroRepository(prisma);
    healthCheck =
      options.healthCheck ?? (async () => void (await prisma.$queryRawUnsafe('SELECT 1')));
    app.addHook('onClose', async () => {
      await prisma.$disconnect();
    });
  }

  registerErrorHandlers(app);

  app.withTypeProvider().get('/health', {
    schema: {
      tags: ['Infraestrutura'],
      summary: 'Verifica se a API e o banco estão disponíveis',
      response: { 200: healthResponseSchema, 503: unavailableHealthResponseSchema },
    },
    handler: async (_request, reply) => {
      try {
        await healthCheck();
        return { status: 'ok' as const };
      } catch {
        return reply.code(503).send({ status: 'unavailable' as const });
      }
    },
  });

  registerHeroRoutes(app, new HeroService(repository));
  return app;
}
