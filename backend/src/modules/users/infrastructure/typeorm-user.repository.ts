import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type NewUser, User } from '../domain/user.entity.js';
import { UserRepository } from '../domain/user.repository.js';

@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {
    super();
  }

  findAll(): Promise<User[]> {
    return this.users.find({ order: { username: 'ASC' } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.users.findOneBy({ username });
  }

  create(data: NewUser): Promise<User> {
    return this.users.save(this.users.create(data));
  }

  async delete(id: string): Promise<void> {
    await this.users.delete({ id });
  }
}
