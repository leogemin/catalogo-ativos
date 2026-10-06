import type { NewUser, User } from './user.entity.js';

/** Contrato de persistência de usuários (implementação TypeORM em `infrastructure/`). */
export abstract class UserRepository {
  abstract findAll(): Promise<User[]>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByUsername(username: string): Promise<User | null>;
  abstract create(data: NewUser): Promise<User>;
  abstract delete(id: string): Promise<void>;
}
