import { http, HttpResponse } from 'msw';
import type { Hero } from '@hero-factory/contracts';

export const activeHero: Hero = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Helena Luz',
  nickname: 'Solaris',
  date_of_birth: '1990-04-12 00:00:00',
  universe: 'Aurora',
  main_power: 'Manipulação da luz',
  avatar_url: 'https://images.hero-factory.test/solaris.svg',
  is_active: true,
  created_at: '2026-09-28 12:00:00',
  updated_at: '2026-09-28 12:00:00',
};

export const inactiveHero: Hero = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Caio Rocha',
  nickname: 'Titã',
  date_of_birth: '1986-08-20 00:00:00',
  universe: 'Órbita',
  main_power: 'Força sobre-humana',
  avatar_url: 'https://images.hero-factory.test/tita.svg',
  is_active: false,
  created_at: '2026-09-27 12:00:00',
  updated_at: '2026-09-27 12:00:00',
};

export const defaultHandlers = [
  http.get('*/api/heroes', () =>
    HttpResponse.json({
      data: [activeHero, inactiveHero],
      pagination: { page: 1, per_page: 10, total: 2, total_pages: 1 },
    }),
  ),
  http.get('*/api/heroes/:id', ({ params }) => {
    const hero = [activeHero, inactiveHero].find((item) => item.id === params.id);
    return hero
      ? HttpResponse.json(hero)
      : HttpResponse.json(
          { error: { code: 'HERO_NOT_FOUND', message: 'Herói não encontrado.' } },
          { status: 404 },
        );
  }),
];
