import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config.js';
import { validateEnv } from '../config/env.validation.js';

// Usado só pela CLI do TypeORM (migration:run/revert/show/generate).
// O TypeORM 1.0 não carrega mais .env sozinho.
if (existsSync('.env')) process.loadEnvFile('.env');

export default new DataSource(buildDataSourceOptions(validateEnv(process.env)));
