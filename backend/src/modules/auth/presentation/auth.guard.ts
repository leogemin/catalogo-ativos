import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ONLY_KEY, type AuthenticatedRequest, IS_PUBLIC_KEY } from '../../../common/auth/auth.decorators.js';
import { ForbiddenError, UnauthorizedError } from '../../../common/errors/domain.errors.js';
import { AuthService } from '../application/auth.service.js';

/**
 * Guard global: toda rota exige `Authorization: Bearer <token>`, exceto as
 * marcadas com `@Public()`; as marcadas com `@AdminOnly()` exigem o admin.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedError('Autenticação necessária.');
    }

    request.user = await this.auth.authenticate(token);

    if (this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, targets) && !request.user.isAdmin) {
      throw new ForbiddenError('Apenas o usuário admin pode realizar esta operação.');
    }
    return true;
  }
}
