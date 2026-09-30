import { describe, expect, it } from 'vitest';

import { heroInputSchema, heroListQuerySchema } from './index.js';

const validHero = {
  name: 'Aurora Silva',
  nickname: 'Aurora',
  date_of_birth: '1992-06-14',
  universe: 'Horizonte',
  main_power: 'Manipulação de luz',
  avatar_url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aurora',
};

describe('heroInputSchema', () => {
  it('normalizes text and accepts a valid hero', () => {
    const result = heroInputSchema.parse({ ...validHero, name: '  Aurora Silva  ' });

    expect(result.name).toBe('Aurora Silva');
  });

  it('rejects impossible dates and non-http avatar URLs', () => {
    expect(() =>
      heroInputSchema.parse({
        ...validHero,
        date_of_birth: '2024-02-31',
        avatar_url: 'ftp://example.com/avatar.png',
      }),
    ).toThrow();
  });
});

describe('heroListQuerySchema', () => {
  it('coerces the page and applies defaults', () => {
    expect(heroListQuerySchema.parse({ page: '2' })).toEqual({ page: 2, search: '' });
  });
});
