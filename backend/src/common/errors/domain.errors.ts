/**
 * Erros da camada de aplicação/domínio, independentes de HTTP. O
 * `ApiExceptionFilter` traduz cada tipo para o status correspondente.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
}

/** Dados sintaticamente válidos que violam uma regra de negócio (HTTP 422). */
export class BusinessRuleError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
}

/** Arquivo/entrada inválida como um todo (HTTP 400). */
export class InvalidInputError extends DomainError {
  readonly code = 'INVALID_INPUT';
}

/** Credenciais ausentes, inválidas ou expiradas (HTTP 401). */
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
}

/** Autenticado, mas sem permissão para a operação (HTTP 403). */
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
}
