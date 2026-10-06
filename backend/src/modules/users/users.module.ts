import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './application/users.service.js';
import { PasswordHasher } from './domain/password-hasher.js';
import { User } from './domain/user.entity.js';
import { UserRepository } from './domain/user.repository.js';
import { ScryptPasswordHasher } from './infrastructure/scrypt-password-hasher.js';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository.js';
import { UsersController } from './presentation/users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    { provide: PasswordHasher, useClass: ScryptPasswordHasher },
  ],
  exports: [UsersService, PasswordHasher],
})
export class UsersModule {}
