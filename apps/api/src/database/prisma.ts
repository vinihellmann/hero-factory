import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client.js';

function parseDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);

  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL deve usar o protocolo mysql://.');
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (database.length === 0) {
    throw new Error('DATABASE_URL deve informar o nome do banco de dados.');
  }

  return {
    host: url.hostname,
    port: url.port === '' ? 3306 : Number(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: 10,
    timezone: 'Z',
  };
}

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL): PrismaClient {
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error('A variável DATABASE_URL é obrigatória.');
  }

  const adapter = new PrismaMariaDb(parseDatabaseUrl(databaseUrl));
  return new PrismaClient({ adapter });
}
