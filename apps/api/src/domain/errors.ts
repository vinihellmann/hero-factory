export class ApplicationError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class HeroNotFoundError extends ApplicationError {
  public constructor() {
    super('HERO_NOT_FOUND', 'Herói não encontrado.', 404);
  }
}

export class InactiveHeroError extends ApplicationError {
  public constructor() {
    super('HERO_INACTIVE', 'Heróis inativos não podem ser editados.', 409);
  }
}
