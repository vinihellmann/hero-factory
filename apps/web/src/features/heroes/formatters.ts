import type { Hero, HeroInput } from '@hero-factory/contracts';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export function formatBirthDate(value: string) {
  const [datePart] = value.split(' ');
  if (!datePart) return '—';

  const date = new Date(`${datePart}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatDateTime(value: string) {
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? '—' : `${dateTimeFormatter.format(date)}`;
}

export function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function toHeroInput(hero: Hero): HeroInput {
  return {
    name: hero.name,
    nickname: hero.nickname,
    date_of_birth: hero.date_of_birth.slice(0, 10),
    universe: hero.universe,
    main_power: hero.main_power,
    avatar_url: hero.avatar_url,
  };
}
