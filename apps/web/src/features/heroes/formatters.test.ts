import { activeHero } from '@/test/fixtures';
import { formatBirthDate, formatDateTime, getInitials, toHeroInput } from './formatters';

describe('formatadores de herói', () => {
  it('formata datas do contrato em português', () => {
    expect(formatBirthDate('1990-04-12 00:00:00')).toBe('12/04/1990');
    expect(formatDateTime('2026-09-28 12:00:00')).toBe('28/09/2026, 09:00');
    expect(formatBirthDate('inválida')).toBe('—');
    expect(formatDateTime('inválida')).toBe('—');
  });

  it.each([
    ['2026-10-01 20:38:00', '01/10/2026, 17:38'],
    ['2026-10-01 02:30:00', '30/09/2026, 23:30'],
    ['2026-01-01 01:00:00', '31/12/2025, 22:00'],
  ])('converte %s de UTC para o horário de Brasília', (value, expected) => {
    expect(formatDateTime(value)).toBe(expected);
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
