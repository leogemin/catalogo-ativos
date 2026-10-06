import { plainToInstance, Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, MinLength, validateSync } from 'class-validator';

// Lê o valor original (obj[key]): com enableImplicitConversion, `value` já
// chegaria convertido por Boolean(), e Boolean('false') === true.
const toBoolean = ({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
  const raw = obj[key];
  return typeof raw === 'string' ? ['true', '1', 'yes'].includes(raw.toLowerCase()) : raw;
};

export class EnvironmentVariables {
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  API_PREFIX: string = 'api';

  /** Lista separada por vírgula; `*` libera qualquer origem. */
  @IsString()
  CORS_ORIGINS: string = 'http://localhost:5173';

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsInt()
  DB_PORT: number = 5432;

  @IsString()
  @IsNotEmpty()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @Transform(toBoolean)
  @IsBoolean()
  DB_SSL: boolean = false;

  @Transform(toBoolean)
  @IsBoolean()
  DB_LOGGING: boolean = false;

  @Transform(toBoolean)
  @IsBoolean()
  DB_MIGRATIONS_RUN: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(1)
  CSV_MAX_FILE_SIZE_MB: number = 5;

  /** Segredo de assinatura dos tokens JWT (HS256). */
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  /** Validade do token de acesso, em segundos (padrão: 8 h). */
  @IsInt()
  @Min(60)
  JWT_EXPIRES_IN: number = 28800;

  /** Senha inicial do usuário "admin", usada só se ele ainda não existir. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  ADMIN_PASSWORD?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors.map((error) => Object.values(error.constraints ?? {}).join(', ')).join('; ');
    throw new Error(`Variáveis de ambiente inválidas: ${details}`);
  }
  return validated;
}
