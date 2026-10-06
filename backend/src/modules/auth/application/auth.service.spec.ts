import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UnauthorizedError } from '../../../common/errors/domain.errors.js';
import { UsersService } from '../../users/application/users.service.js';
import { PasswordHasher } from '../../users/domain/password-hasher.js';
import type { User } from '../../users/domain/user.entity.js';
import { AuthService } from './auth.service.js';

const SECRET = 'segredo-de-teste-com-pelo-menos-32-caracteres';

const admin: User = {
  id: '0b6b6c1e-2f0a-4a3b-9d7e-6a3f3f1a2b3c',
  username: 'admin',
  passwordHash: 'hash-admin',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  const users = { findByUsername: vi.fn(), findById: vi.fn() };
  const hasher = { hash: vi.fn(), verify: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    hasher.hash.mockResolvedValue('dummy-hash');
    hasher.verify.mockImplementation(
      async (password: string, hash: string) => hash === 'hash-admin' && password === 'certa',
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: PasswordHasher, useValue: hasher },
        { provide: JwtService, useValue: new JwtService({ secret: SECRET, signOptions: { expiresIn: 60 } }) },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('faz login e o token devolvido autentica o mesmo usuário', async () => {
    users.findByUsername.mockResolvedValue(admin);
    users.findById.mockResolvedValue(admin);

    const result = await service.login('admin', 'certa');
    expect(result.user).toEqual({ id: admin.id, username: 'admin', isAdmin: true });
    await expect(service.authenticate(result.accessToken)).resolves.toEqual(result.user);
  });

  it('rejeita senha errada e usuário inexistente com a mesma mensagem', async () => {
    users.findByUsername.mockResolvedValueOnce(admin).mockResolvedValueOnce(null);

    const wrongPassword = await service.login('admin', 'errada').catch((error: unknown) => error);
    const unknownUser = await service.login('fulano', 'certa').catch((error: unknown) => error);

    expect(wrongPassword).toBeInstanceOf(UnauthorizedError);
    expect(unknownUser).toBeInstanceOf(UnauthorizedError);
    expect((unknownUser as Error).message).toBe((wrongPassword as Error).message);
    // Também verifica senha quando o usuário não existe (tempo de resposta uniforme).
    expect(hasher.verify).toHaveBeenLastCalledWith('certa', 'dummy-hash');
  });

  it('rejeita token inválido ou de usuário removido', async () => {
    await expect(service.authenticate('nao-e-um-jwt')).rejects.toBeInstanceOf(UnauthorizedError);

    const forged = await new JwtService({ secret: 'outro-segredo-com-mais-de-32-caracteres!' }).signAsync({
      sub: admin.id,
    });
    await expect(service.authenticate(forged)).rejects.toBeInstanceOf(UnauthorizedError);

    users.findByUsername.mockResolvedValue(admin);
    const { accessToken } = await service.login('admin', 'certa');
    users.findById.mockResolvedValue(null);
    await expect(service.authenticate(accessToken)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
