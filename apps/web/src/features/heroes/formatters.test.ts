import { activeHero } from '@/test/fixtures';
import { formatBirthDate, formatDateTime, getInitials, toHeroInput } from './formatters';

describe('formatadores de herói', () => {
  it('formata datas do contrato em português', () => {
    expect(formatBirthDate('1990-04-12 00:00:00')).toBe('12/04/1990');
    expect(formatDateTime('2026-09-28 12:00:00')).toContain('UTC');
    expect(formatBirthDate('inválida')).toBe('—');
    expect(formatDateTime('inválida')).toBe('—');
  });

  it('extrai iniciais e converte um herói para entrada editável', () => {
    expect(getInitials('  Mulher Maravilha  ')).toBe('MM');
    expect(getInitials('')).toBe('');
    expect(toHeroInput(activeHero)).toEqual({
      name: activeHero.name,
      nickname: activeHero.nickname,
      date_of_birth: '1990-04-12',
      universe: activeHero.universe,
      main_power: activeHero.main_power,
      avatar_url: activeHero.avatar_url,
    });
  });
});
