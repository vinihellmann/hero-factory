import { resolve } from 'node:path';

import { config } from 'dotenv';

import { createPrismaClient } from '../src/database/prisma.js';

config({ path: resolve(import.meta.dirname, '../../../.env'), quiet: true });

const heroes = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Luna Valente',
    nickname: 'Aurora',
    dateOfBirth: '1992-05-14',
    universe: 'Horizonte Solar',
    mainPower: 'Manipulação de luz',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aurora',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Caio Venturi',
    nickname: 'Vendaval',
    dateOfBirth: '1988-11-03',
    universe: 'Guardiões do Céu',
    mainPower: 'Controle dos ventos',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Vendaval',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    name: 'Maya Nogueira',
    nickname: 'Flora',
    dateOfBirth: '1995-02-21',
    universe: 'Raízes Eternas',
    mainPower: 'Criação de vida vegetal',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Flora',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    name: 'Davi Monteiro',
    nickname: 'Titânio',
    dateOfBirth: '1985-08-09',
    universe: 'Cidade de Aço',
    mainPower: 'Pele metálica',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Titanio',
    isActive: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    name: 'Iara Campos',
    nickname: 'Maré',
    dateOfBirth: '1997-07-30',
    universe: 'Abismo Azul',
    mainPower: 'Hidrocinese',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mare',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    name: 'Ravi Prado',
    nickname: 'Pulso',
    dateOfBirth: '1990-12-18',
    universe: 'Fronteira Quântica',
    mainPower: 'Emissão de ondas de energia',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Pulso',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    name: 'Elisa Noronha',
    nickname: 'Prisma',
    dateOfBirth: '1993-04-02',
    universe: 'Horizonte Solar',
    mainPower: 'Refração e ilusões luminosas',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Prisma',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    name: 'Bento Azevedo',
    nickname: 'Atlas',
    dateOfBirth: '1982-09-25',
    universe: 'Guardiões do Céu',
    mainPower: 'Força gravitacional',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Atlas',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000009',
    name: 'Nina Sato',
    nickname: 'Eco',
    dateOfBirth: '1998-01-11',
    universe: 'Cidade de Aço',
    mainPower: 'Duplicação de sons',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Eco',
    isActive: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000010',
    name: 'Theo Bastos',
    nickname: 'Nexo',
    dateOfBirth: '1991-06-06',
    universe: 'Fronteira Quântica',
    mainPower: 'Criação de portais',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Nexo',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000011',
    name: 'Sara Luz',
    nickname: 'Centelha',
    dateOfBirth: '1996-10-19',
    universe: 'Horizonte Solar',
    mainPower: 'Controle de eletricidade',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Centelha',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000012',
    name: 'Otávio Reis',
    nickname: 'Cronos',
    dateOfBirth: '1987-03-27',
    universe: 'Relógio Infinito',
    mainPower: 'Desaceleração temporal',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cronos',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000013',
    name: 'Yasmin Teles',
    nickname: 'Nebulosa',
    dateOfBirth: '1994-12-01',
    universe: 'Órbita Distante',
    mainPower: 'Manipulação de poeira cósmica',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Nebulosa',
    isActive: true,
  },
] as const;

async function seed(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    const result = await prisma.hero.createMany({
      data: heroes.map((hero, index) => {
        const createdAt = new Date(Date.UTC(2026, 0, index + 1, 12));
        return {
          ...hero,
          dateOfBirth: new Date(`${hero.dateOfBirth}T00:00:00.000Z`),
          createdAt,
          updatedAt: createdAt,
        };
      }),
      skipDuplicates: true,
    });

    console.info(`Seed concluído: ${result.count} novo(s) herói(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error('Falha ao executar o seed.', error);
  process.exitCode = 1;
});
