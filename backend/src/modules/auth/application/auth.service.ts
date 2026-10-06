import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedUser } from '../../../common/auth/auth.decorators.js';
import { UnauthorizedError } from '../../../common/errors/domain.errors.js';
import { UsersService } from '../../users/application/users.service.js';
import { PasswordHasher } from '../../users/domain/password-hasher.js';
import { isAdmin, type User } from '../../users/domain/user.entity.js';

export interface AccessTokenPayload {
  sub: string;
  username: string;
}

export interface LoginResult {
  accessToken: string;
  user: AuthenticatedUser;
}

const INVALID_CREDENTIALS = 'Usuário ou senha inválidos.';

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return { id: user.id, username: user.username, isAdmin: isAdmin(user) };
}

@Injectable()
export class AuthService {
  // Hash de uma senha qualquer: quando o usuário não existe, a verificação
  // roda mesmo assim, para o tempo de resposta não revelar quais existem.
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByUsername(username);
    this.dummyHash ??= this.hasher.hash('senha-inexistente');
    const valid = await this.hasher.verify(password, user?.passwordHash ?? (await this.dummyHash));
    if (!user || !valid) throw new UnauthorizedError(INVALID_CREDENTIALS);

    const payload: AccessTokenPayload = { sub: user.id, username: user.username };
    return { accessToken: await this.jwt.signAsync(payload), user: toAuthenticatedUser(user) };
  }

  /** Valida o token e confirma que o usuário ainda existe (removido = sem acesso). */
  async authenticate(token: string): Promise<AuthenticatedUser> {
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedError('Sessão inválida ou expirada.');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedError('Sessão inválida ou expirada.');
    return toAuthenticatedUser(user);
  }
}
