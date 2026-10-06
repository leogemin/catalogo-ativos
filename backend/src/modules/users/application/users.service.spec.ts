import { Test } from '@nestjs/testing';
import { BusinessRuleError, ConflictError } from '../../../common/errors/domain.errors.js';
import { PasswordHasher } from '../domain/password-hasher.js';
import type { User } from '../domain/user.entity.js';
import { UserRepository } from '../domain/user.repository.js';
import { UsersService } from './users.service.js';

const user = (username: string): User => ({
  id: `id-${username}`,
  username,
  passwordHash: 'hash',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('UsersService', () => {
  let service: UsersService;
  const repository = { findAll: vi.fn(), findById: vi.fn(), findByUsername: vi.fn(), create: vi.fn(), delete: vi.fn() };
  const hasher = { hash: vi.fn(), verify: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    hasher.hash.mockImplementation(async (password: string) => `hashed:${password}`);
    repository.create.mockImplementation(async (data: object) => ({ id: 'new', ...data }));

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: repository },
        { provide: PasswordHasher, useValue: hasher },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('cria usuário com username normalizado e senha com hash', async () => {
    repository.findByUsername.mockResolvedValue(null);
    await service.create({ username: '  Maria.Perez ', password: 'segredo123' });

    expect(repository.findByUsername).toHaveBeenCalledWith('maria.perez');
    expect(repository.create).toHaveBeenCalledWith({ username: 'maria.perez', passwordHash: 'hashed:segredo123' });
  });

  it('rejeita username duplicado sem diferenciar maiúsculas', async () => {
    repository.findByUsername.mockResolvedValue(user('maria'));
    await expect(service.create({ username: 'MARIA', password: 'segredo123' })).rejects.toBeInstanceOf(ConflictError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('não permite remover o admin', async () => {
    repository.findById.mockResolvedValue(user('admin'));
    await expect(service.remove('id-admin')).rejects.toBeInstanceOf(BusinessRuleError);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('ensureAdmin cria o admin só quando ele não existe', async () => {
    repository.findByUsername.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    expect(await service.ensureAdmin('senha-admin')).toBe(true);
    expect(repository.create).toHaveBeenCalledWith({ username: 'admin', passwordHash: 'hashed:senha-admin' });

    repository.findByUsername.mockResolvedValue(user('admin'));
    expect(await service.ensureAdmin('outra-senha')).toBe(false);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
