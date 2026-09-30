import type { Hero, HeroListResponse } from '@hero-factory/contracts';

import type { HeroPage } from '../application/hero-service.js';
import type { HeroEntity } from '../domain/hero.js';

export function formatSqlDateTime(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function presentHero(hero: HeroEntity): Hero {
  return {
    id: hero.id,
    name: hero.name,
    nickname: hero.nickname,
    date_of_birth: formatSqlDateTime(hero.dateOfBirth),
    universe: hero.universe,
    main_power: hero.mainPower,
    avatar_url: hero.avatarUrl,
    is_active: hero.isActive,
    created_at: formatSqlDateTime(hero.createdAt),
    updated_at: formatSqlDateTime(hero.updatedAt),
  };
}

export function presentHeroPage(page: HeroPage): HeroListResponse {
  return {
    data: page.heroes.map(presentHero),
    pagination: {
      page: page.page,
      per_page: page.perPage,
      total: page.total,
      total_pages: page.totalPages,
    },
  };
}
