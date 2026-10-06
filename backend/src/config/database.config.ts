import type { DataSourceOptions } from 'typeorm';
import { migrations } from '../database/migrations/index.js';
import { CatalogItem } from '../modules/catalogs/domain/catalog-item.entity.js';
import { Catalog } from '../modules/catalogs/domain/catalog.entity.js';
import { User } from '../modules/users/domain/user.entity.js';
import type { EnvironmentVariables } from './env.validation.js';

export type DatabaseEnv = Pick<
  EnvironmentVariables,
  'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME' | 'DB_SSL' | 'DB_LOGGING' | 'DB_MIGRATIONS_RUN'
>;

/** Opções únicas usadas pela aplicação Nest e pela CLI de migrations. */
export function buildDataSourceOptions(env: DatabaseEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.DB_SSL,
    logging: env.DB_LOGGING,
    entities: [Catalog, CatalogItem, User],
    migrations,
    migrationsRun: env.DB_MIGRATIONS_RUN,
    // O schema é versionado só por migrations; nunca sincronizar automático.
    synchronize: false,
    uuidExtension: 'pgcrypto',
  };
}
