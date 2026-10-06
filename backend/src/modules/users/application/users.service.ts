import { Injectable } from '@nestjs/common';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../../common/errors/domain.errors.js';
import { PasswordHasher } from '../domain/password-hasher.js';
import { ADMIN_USERNAME, isAdmin, type User } from '../domain/user.entity.js';
import { UserRepository } from '../domain/user.repository.js';

export interface UserCredentials {
  username: string;
  password: string;
}

/** Usernames são comparados e gravados sem diferenciar maiúsculas. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  list(): Promise<User[]> {
    return this.users.findAll();
  }

  findById(id: string): Promise<User | null> {
    return this.users.findById(id);
  }

  findByUsername(username: string): Promise<User | null> {
    return this.users.findByUsername(normalizeUsername(username));
  }

  async create({ username, password }: UserCredentials): Promise<User> {
    const normalized = normalizeUsername(username);
    if (await this.users.findByUsername(normalized)) {
      throw new ConflictError(`Já existe um usuário "${normalized}".`);
    }
    return this.users.create({ username: normalized, passwordHash: await this.hasher.hash(password) });
  }

  async remove(id: string): Promise<void> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError(`Usuário ${id} não encontrado.`);
    if (isAdmin(user)) throw new BusinessRuleError('O usuário admin não pode ser removido.');
    await this.users.delete(id);
  }

  /** Cria o usuário admin se ainda não existir. Devolve `true` se criou. */
  async ensureAdmin(password: string): Promise<boolean> {
    if (await this.users.findByUsername(ADMIN_USERNAME)) return false;
    await this.create({ username: ADMIN_USERNAME, password });
    return true;
  }
}
