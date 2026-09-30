import type { HeroInput } from '@hero-factory/contracts';
import { describe, expect, it } from 'vitest';

import { HeroNotFoundError, InactiveHeroError } from '../domain/errors.js';
import type {
  HeroEntity,
  HeroRepository,
  HeroWriteData,
  ListHeroesOptions,
} from '../domain/hero.js';
import { HeroService } from './hero-service.js';

const baseInput: HeroInput = {
  name: 'Luna Valente',
  nickname: 'Aurora',
  date_of_birth: '1992-05-14',
  universe: 'Horizonte Solar',
  main_power: 'Manipulação de luz',
  avatar_url: 'https://example.com/aurora.png',
};

function makeHero(overrides: Partial<HeroEntity> = {}): HeroEntity {
  return {
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
    ...overrides,
  };
}

class FakeHeroRepository implements HeroRepository {
  public heroes: HeroEntity[] = [];
  public lastListOptions: ListHeroesOptions | undefined;

  public list(options: ListHeroesOptions) {
    this.lastListOptions = options;
    return Promise.resolve({ heroes: this.heroes, total: this.heroes.length });
  }

  public findById(id: string) {
    return Promise.resolve(this.heroes.find((hero) => hero.id === id) ?? null);
  }

  public create(data: HeroWriteData) {
    const hero = makeHero({ ...data });
    this.heroes.push(hero);
    return Promise.resolve(hero);
  }

  public updateIfActive(id: string, data: HeroWriteData) {
    const index = this.heroes.findIndex((hero) => hero.id === id && hero.isActive);
    if (index < 0) return Promise.resolve(null);

    const current = this.heroes[index];
    if (current === undefined) return Promise.resolve(null);
    const updated = { ...current, ...data, updatedAt: new Date('2026-02-01T10:00:00.000Z') };
    this.heroes[index] = updated;
    return Promise.resolve(updated);
  }

  public setActive(id: string, isActive: boolean) {
    const index = this.heroes.findIndex((hero) => hero.id === id);
    if (index < 0) return Promise.resolve(null);

    const current = this.heroes[index];
    if (current === undefined) return Promise.resolve(null);
    if (current.isActive === isActive) return Promise.resolve(current);

    const updated = { ...current, isActive, updatedAt: new Date('2026-02-01T10:00:00.000Z') };
    this.heroes[index] = updated;
    return Promise.resolve(updated);
  }
}

describe('HeroService', () => {
  it('creates a hero and converts the input date to UTC', async () => {
    const repository = new FakeHeroRepository();
    const service = new HeroService(repository);

    const created = await service.create(baseInput);

    expect(created.dateOfBirth.toISOString()).toBe('1992-05-14T00:00:00.000Z');
    expect(created.mainPower).toBe(baseInput.main_power);
    expect(created.isActive).toBe(true);
  });

  it('lists ten heroes per page and calculates the page count', async () => {
    const repository = new FakeHeroRepository();
    repository.heroes = Array.from({ length: 21 }, (_, index) =>
      makeHero({ id: `10000000-0000-4000-8000-${String(index).padStart(12, '0')}` }),
    );
    const service = new HeroService(repository);

    const page = await service.list({ page: 2, search: 'aurora' });

    expect(repository.lastListOptions).toEqual({ page: 2, perPage: 10, search: 'aurora' });
    expect(page).toMatchObject({ page: 2, perPage: 10, total: 21, totalPages: 3 });
  });

  it('returns one existing hero', async () => {
    const repository = new FakeHeroRepository();
    const hero = makeHero();
    repository.heroes.push(hero);

    await expect(new HeroService(repository).getById(hero.id)).resolves.toBe(hero);
  });

  it('reports a missing hero', async () => {
    const service = new HeroService(new FakeHeroRepository());

    await expect(service.getById('missing')).rejects.toBeInstanceOf(HeroNotFoundError);
    await expect(service.deactivate('missing')).rejects.toBeInstanceOf(HeroNotFoundError);
    await expect(service.setStatus('missing', { is_active: true })).rejects.toBeInstanceOf(
      HeroNotFoundError,
    );
  });

  it('updates an active hero', async () => {
    const repository = new FakeHeroRepository();
    const hero = makeHero();
    repository.heroes.push(hero);

    const updated = await new HeroService(repository).update(hero.id, {
      ...baseInput,
      nickname: 'Nova Aurora',
    });

    expect(updated.nickname).toBe('Nova Aurora');
  });

  it('rejects edits to an inactive hero', async () => {
    const repository = new FakeHeroRepository();
    const hero = makeHero({ isActive: false });
    repository.heroes.push(hero);

    await expect(new HeroService(repository).update(hero.id, baseInput)).rejects.toBeInstanceOf(
      InactiveHeroError,
    );
  });

  it('distinguishes a missing hero during update', async () => {
    const service = new HeroService(new FakeHeroRepository());

    await expect(service.update('missing', baseInput)).rejects.toBeInstanceOf(HeroNotFoundError);
  });

  it('deactivates and reactivates a hero idempotently', async () => {
    const repository = new FakeHeroRepository();
    const hero = makeHero();
    repository.heroes.push(hero);
    const service = new HeroService(repository);

    const inactive = await service.deactivate(hero.id);
    const inactiveAgain = await service.deactivate(hero.id);
    const active = await service.setStatus(hero.id, { is_active: true });

    expect(inactive.isActive).toBe(false);
    expect(inactiveAgain).toBe(inactive);
    expect(active.isActive).toBe(true);
  });
});
