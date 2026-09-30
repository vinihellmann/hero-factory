import 'dotenv/config';

import { z } from 'zod';

import { buildApp } from './app.js';

const environmentSchema = z.object({
  API_PORT: z.coerce.number().int().positive().max(65_535).default(3333),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
});

async function start(): Promise<void> {
  const environment = environmentSchema.parse(process.env);
  const app = await buildApp({
    databaseUrl: environment.DATABASE_URL,
    webOrigin: environment.WEB_ORIGIN,
    logger: true,
  });

  let closing = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, 'Encerrando a API');
    await app.close();
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ host: '0.0.0.0', port: environment.API_PORT });
}

start().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
