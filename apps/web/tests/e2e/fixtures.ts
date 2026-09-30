import { test as base, expect, type Page, type Route } from '@playwright/test';
import type { Hero, HeroInput } from '@hero-factory/contracts';

type HeroApi = {
  heroes: Hero[];
};

function uuid(index: number) {
  return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

const names = [
  ['Helena Luz', 'Solaris', 'Manipulação da luz', 'Aurora'],
  ['Caio Rocha', 'Titã', 'Força sobre-humana', 'Órbita'],
  ['Nina Torres', 'Nebulosa', 'Criação de portais', 'Aurora'],
  ['Ravi Dias', 'Pulso', 'Controle elétrico', 'Vértice'],
  ['Maya Costa', 'Miragem', 'Ilusões', 'Órbita'],
  ['Theo Lima', 'Guardião', 'Campo de força', 'Aurora'],
  ['Iara Melo', 'Maré', 'Controle das águas', 'Vértice'],
  ['Noah Vale', 'Cometa', 'Voo hipersônico', 'Órbita'],
  ['Luna Reis', 'Prisma', 'Refração de energia', 'Aurora'],
  ['Bento Nunes', 'Atlas', 'Resistência extrema', 'Vértice'],
  ['Cora Alves', 'Faísca', 'Pirocinese', 'Órbita'],
  ['Gael Martins', 'Eco', 'Manipulação sonora', 'Aurora'],
] as const;

function createHeroes(): Hero[] {
  return names.map(([name, nickname, mainPower, universe], index) => ({
    id: uuid(index + 1),
    name,
    nickname,
    date_of_birth: `199${index % 10}-0${(index % 8) + 1}-12 00:00:00`,
    universe,
    main_power: mainPower,
    avatar_url: `https://images.hero-factory.test/${index + 1}.svg`,
    is_active: index !== 1,
    created_at: `2026-09-${String(28 - index).padStart(2, '0')} 12:00:00`,
    updated_at: `2026-09-${String(28 - index).padStart(2, '0')} 12:00:00`,
  }));
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function installHeroApi(page: Page, heroes: Hero[]) {
  await page.route('https://images.hero-factory.test/**', async (route) => {
    const label =
      new URL(route.request().url()).pathname.split('/').pop()?.replace('.svg', '') ?? 'HF';
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760"><defs><linearGradient id="g"><stop stop-color="#3154d9"/><stop offset="1" stop-color="#172554"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="300" cy="260" r="115" fill="#f8fafc" opacity=".92"/><path d="M95 700c25-190 385-190 410 0" fill="#f8fafc" opacity=".92"/><text x="300" y="735" text-anchor="middle" font-family="sans-serif" font-size="40" fill="white">HERO ${label}</text></svg>`,
    });
  });

  await page.route('**/api/heroes**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const statusMatch = url.pathname.match(/\/api\/heroes\/([^/]+)\/status$/);
    const itemMatch = url.pathname.match(/\/api\/heroes\/([^/]+)$/);

    if (url.pathname.endsWith('/api/heroes') && method === 'GET') {
      const pageNumber = Number(url.searchParams.get('page') ?? '1');
      const search = normalize(url.searchParams.get('search') ?? '');
      const filtered = search
        ? heroes.filter(
            (hero) =>
              normalize(hero.name).includes(search) || normalize(hero.nickname).includes(search),
          )
        : heroes;
      const start = (pageNumber - 1) * 10;
      await fulfillJson(route, {
        data: filtered.slice(start, start + 10),
        pagination: {
          page: pageNumber,
          per_page: 10,
          total: filtered.length,
          total_pages: Math.ceil(filtered.length / 10),
        },
      });
      return;
    }

    if (url.pathname.endsWith('/api/heroes') && method === 'POST') {
      const input = (await request.postDataJSON()) as HeroInput;
      const created: Hero = {
        ...input,
        id: uuid(99),
        date_of_birth: `${input.date_of_birth} 00:00:00`,
        is_active: true,
        created_at: '2026-09-29 18:00:00',
        updated_at: '2026-09-29 18:00:00',
      };
      heroes.unshift(created);
      await fulfillJson(route, created, 201);
      return;
    }

    if (statusMatch && method === 'PATCH') {
      const hero = heroes.find((item) => item.id === statusMatch[1]);
      if (!hero)
        return fulfillJson(
          route,
          { error: { code: 'NOT_FOUND', message: 'Herói não encontrado.' } },
          404,
        );
      hero.is_active = ((await request.postDataJSON()) as { is_active: boolean }).is_active;
      hero.updated_at = '2026-09-29 18:10:00';
      await fulfillJson(route, hero);
      return;
    }

    if (itemMatch) {
      const hero = heroes.find((item) => item.id === itemMatch[1]);
      if (!hero)
        return fulfillJson(
          route,
          { error: { code: 'NOT_FOUND', message: 'Herói não encontrado.' } },
          404,
        );

      if (method === 'GET') return fulfillJson(route, hero);
      if (method === 'DELETE') {
        hero.is_active = false;
        hero.updated_at = '2026-09-29 18:10:00';
        return fulfillJson(route, hero);
      }
      if (method === 'PUT') {
        const input = (await request.postDataJSON()) as HeroInput;
        Object.assign(hero, input, {
          date_of_birth: `${input.date_of_birth} 00:00:00`,
          updated_at: '2026-09-29 18:10:00',
        });
        return fulfillJson(route, hero);
      }
    }

    await route.fallback();
  });
}

export const test = base.extend<{ heroApi: HeroApi }>({
  heroApi: async ({ page }, use) => {
    const heroes = createHeroes();
    if (!process.env.PLAYWRIGHT_BASE_URL) {
      await installHeroApi(page, heroes);
    }
    await use({ heroes });
  },
});

export { expect };
