import type { Prisma, Hero as PrismaHero, PrismaClient } from '../generated/prisma/client.js';
import type {
  HeroEntity,
  HeroRepository,
  HeroWriteData,
  ListHeroesOptions,
} from '../domain/hero.js';

function toEntity(hero: PrismaHero): HeroEntity {
  return {
    id: hero.id,
    name: hero.name,
    nickname: hero.nickname,
    dateOfBirth: hero.dateOfBirth,
    universe: hero.universe,
    mainPower: hero.mainPower,
    avatarUrl: hero.avatarUrl,
    isActive: hero.isActive,
    createdAt: hero.createdAt,
    updatedAt: hero.updatedAt,
  };
}

function toPersistenceData(data: HeroWriteData) {
  return {
    name: data.name,
    nickname: data.nickname,
    dateOfBirth: data.dateOfBirth,
    universe: data.universe,
    mainPower: data.mainPower,
    avatarUrl: data.avatarUrl,
  };
}

export class PrismaHeroRepository implements HeroRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async list(options: ListHeroesOptions) {
    const where: Prisma.HeroWhereInput =
      options.search.length === 0
        ? {}
        : {
            OR: [
              { name: { contains: options.search } },
              { nickname: { contains: options.search } },
            ],
          };

    const [total, heroes] = await this.prisma.$transaction([
      this.prisma.hero.count({ where }),
      this.prisma.hero.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (options.page - 1) * options.perPage,
        take: options.perPage,
      }),
    ]);

    return { total, heroes: heroes.map(toEntity) };
  }

  public async findById(id: string) {
    const hero = await this.prisma.hero.findUnique({ where: { id } });
    return hero === null ? null : toEntity(hero);
  }

  public async create(data: HeroWriteData) {
    const hero = await this.prisma.hero.create({ data: toPersistenceData(data) });
    return toEntity(hero);
  }

  public async updateIfActive(id: string, data: HeroWriteData) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.hero.updateMany({
        where: { id, isActive: true },
        data: toPersistenceData(data),
      });

      if (result.count === 0) return null;

      const hero = await transaction.hero.findUnique({ where: { id } });
      return hero === null ? null : toEntity(hero);
    });
  }

  public async setActive(id: string, isActive: boolean) {
    return this.prisma.$transaction(async (transaction) => {
      const locked = await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM heroes WHERE id = ${id} FOR UPDATE
      `;
      if (locked.length === 0) return null;

      const existing = await transaction.hero.findUnique({ where: { id } });
      if (existing === null) return null;
      if (existing.isActive === isActive) return toEntity(existing);

      const hero = await transaction.hero.update({ where: { id }, data: { isActive } });
      return toEntity(hero);
    });
  }
}
