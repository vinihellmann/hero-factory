import type { HeroInput } from '@hero-factory/contracts';

export interface HeroEntity {
  id: string;
  name: string;
  nickname: string;
  dateOfBirth: Date;
  universe: string;
  mainPower: string;
  avatarUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HeroWriteData {
  name: string;
  nickname: string;
  dateOfBirth: Date;
  universe: string;
  mainPower: string;
  avatarUrl: string;
}

export interface ListHeroesOptions {
  page: number;
  perPage: number;
  search: string;
}

export interface HeroRepository {
  list(options: ListHeroesOptions): Promise<{ heroes: HeroEntity[]; total: number }>;
  findById(id: string): Promise<HeroEntity | null>;
  create(data: HeroWriteData): Promise<HeroEntity>;
  updateIfActive(id: string, data: HeroWriteData): Promise<HeroEntity | null>;
  setActive(id: string, isActive: boolean): Promise<HeroEntity | null>;
}

export function toHeroWriteData(input: HeroInput): HeroWriteData {
  return {
    name: input.name,
    nickname: input.nickname,
    dateOfBirth: new Date(`${input.date_of_birth}T00:00:00.000Z`),
    universe: input.universe,
    mainPower: input.main_power,
    avatarUrl: input.avatar_url,
  };
}
