import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/domain.errors.js';

/** Formato único de erro da API (ver `ErrorResponseDto`). */
export interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_CHECK_VIOLATION = '23514';

@Catch(DomainError, QueryFailedError, HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: DomainError | QueryFailedError | HttpException, host: ArgumentsHost): void {
    const body =
      exception instanceof DomainError
        ? this.fromDomain(exception)
        : exception instanceof HttpException
          ? this.fromHttp(exception)
          : this.fromDatabase(exception);
    host.switchToHttp().getResponse<Response>().status(body.statusCode).json(body);
  }

  private fromDomain(error: DomainError): ErrorBody {
    const statusCode =
      error instanceof NotFoundError
        ? HttpStatus.NOT_FOUND
        : error instanceof ConflictError
          ? HttpStatus.CONFLICT
          : error instanceof BusinessRuleError
            ? HttpStatus.UNPROCESSABLE_ENTITY
            : error instanceof InvalidInputError
              ? HttpStatus.BAD_REQUEST
              : error instanceof UnauthorizedError
                ? HttpStatus.UNAUTHORIZED
                : error instanceof ForbiddenError
                  ? HttpStatus.FORBIDDEN
                  : HttpStatus.INTERNAL_SERVER_ERROR;
    return { statusCode, code: error.code, message: error.message, details: error.details };
  }

  // Erros do próprio Nest: ValidationPipe, ParseUUIDPipe, multer (413), rota inexistente...
  private fromHttp(error: HttpException): ErrorBody {
    const statusCode = error.getStatus();
    const response = error.getResponse();
    const message = typeof response === 'string' ? response : (response as { message?: unknown }).message;
    const code = (HttpStatus as Record<number, string>)[statusCode] ?? 'HTTP_ERROR';

    if (Array.isArray(message)) {
      return { statusCode, code: 'VALIDATION_ERROR', message: 'Requisição inválida.', details: { errors: message } };
    }
    return { statusCode, code, message: typeof message === 'string' ? message : error.message };
  }

  // Rede de segurança para corridas que escapam das checagens da aplicação
  // (ex.: dois POSTs simultâneos com o mesmo nome de catálogo).
  private fromDatabase(error: QueryFailedError): ErrorBody {
    const pgCode = (error.driverError as { code?: string } | undefined)?.code;
    switch (pgCode) {
      case PG_UNIQUE_VIOLATION:
        return { statusCode: HttpStatus.CONFLICT, code: 'CONFLICT', message: 'Registro duplicado.' };
      case PG_FOREIGN_KEY_VIOLATION:
        return { statusCode: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'Registro relacionado não encontrado.' };
      case PG_CHECK_VIOLATION:
        return {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Os dados violam uma regra de integridade.',
        };
      default:
        this.logger.error(error.message, error.stack);
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'INTERNAL_ERROR',
          message: 'Erro interno ao acessar o banco de dados.',
        };
    }
  }
}
