import { HEROES_PER_PAGE } from '@hero-factory/contracts';
import type { HeroInput, HeroListQuery, HeroStatusInput } from '@hero-factory/contracts';

import { HeroNotFoundError, InactiveHeroError } from '../domain/errors.js';
import { toHeroWriteData } from '../domain/hero.js';
import type { HeroEntity, HeroRepository } from '../domain/hero.js';

export interface HeroPage {
  heroes: HeroEntity[];
  page: number;
  perPage: typeof HEROES_PER_PAGE;
  total: number;
  totalPages: number;
}

export class HeroService {
  public constructor(private readonly repository: HeroRepository) {}

  public async list(query: HeroListQuery): Promise<HeroPage> {
    const result = await this.repository.list({
      page: query.page,
      perPage: HEROES_PER_PAGE,
      search: query.search,
    });

    return {
      heroes: result.heroes,
      page: query.page,
      perPage: HEROES_PER_PAGE,
      total: result.total,
      totalPages: Math.ceil(result.total / HEROES_PER_PAGE),
    };
  }

  public async getById(id: string): Promise<HeroEntity> {
    const hero = await this.repository.findById(id);

    if (hero === null) {
      throw new HeroNotFoundError();
    }

    return hero;
  }

  public create(input: HeroInput): Promise<HeroEntity> {
    return this.repository.create(toHeroWriteData(input));
  }

  public async update(id: string, input: HeroInput): Promise<HeroEntity> {
    const hero = await this.repository.updateIfActive(id, toHeroWriteData(input));

    if (hero !== null) {
      return hero;
    }

    const existingHero = await this.repository.findById(id);
    if (existingHero === null) {
      throw new HeroNotFoundError();
    }

    throw new InactiveHeroError();
  }

  public async deactivate(id: string): Promise<HeroEntity> {
    const hero = await this.repository.setActive(id, false);

    if (hero === null) {
      throw new HeroNotFoundError();
    }

    return hero;
  }

  public async setStatus(id: string, input: HeroStatusInput): Promise<HeroEntity> {
    const hero = await this.repository.setActive(id, input.is_active);

    if (hero === null) {
      throw new HeroNotFoundError();
    }

    return hero;
  }
}
