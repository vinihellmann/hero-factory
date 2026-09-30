import { resolve } from 'node:path';

import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: resolve(import.meta.dirname, '../../.env'), quiet: true });

const databaseUrl =
  process.env.DATABASE_URL ?? 'mysql://hero_user:hero_password@localhost:3306/hero_factory';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
