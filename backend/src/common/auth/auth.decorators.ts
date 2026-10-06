import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';

/** Usuário autenticado anexado à requisição pelo `AuthGuard`. */
export interface AuthenticatedUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

export const IS_PUBLIC_KEY = 'auth:isPublic';
export const ADMIN_ONLY_KEY = 'auth:adminOnly';

/** Libera a rota sem token (por padrão, toda rota exige autenticação). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restringe a rota (ou o controller inteiro) ao usuário admin. */
export const AdminOnly = () => SetMetadata(ADMIN_ONLY_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
