import { describe, expect, it } from 'vitest';

import type { HeroEntity } from '../domain/hero.js';
import { formatSqlDateTime, presentHero, presentHeroPage } from './hero-presenter.js';

const hero: HeroEntity = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Luna Valente',
  nickname: 'Aurora',
  dateOfBirth: new Date('1992-05-14T00:00:00.000Z'),
  universe: 'Horizonte Solar',
  mainPower: 'Manipulação de luz',
  avatarUrl: 'https://example.com/aurora.png',
  isActive: true,
  createdAt: new Date('2026-01-02T03:04:05.999Z'),
  updatedAt: new Date('2026-02-03T04:05:06.999Z'),
};

describe('hero presenter', () => {
  it('formats dates in UTC using the public SQL date format', () => {
    expect(formatSqlDateTime(new Date('2026-01-02T03:04:05.999Z'))).toBe('2026-01-02 03:04:05');
  });

  it('maps internal camelCase fields to the public contract', () => {
    expect(presentHero(hero)).toEqual({
      id: hero.id,
      name: hero.name,
      nickname: hero.nickname,
      date_of_birth: '1992-05-14 00:00:00',
      universe: hero.universe,
      main_power: hero.mainPower,
      avatar_url: hero.avatarUrl,
      is_active: true,
      created_at: '2026-01-02 03:04:05',
      updated_at: '2026-02-03 04:05:06',
    });
  });

  it('maps page metadata and heroes', () => {
    expect(
      presentHeroPage({
        heroes: [hero],
        page: 2,
        perPage: 10,
        total: 11,
        totalPages: 2,
      }),
    ).toMatchObject({
      data: [{ id: hero.id }],
      pagination: { page: 2, per_page: 10, total: 11, total_pages: 2 },
    });
  });
});
