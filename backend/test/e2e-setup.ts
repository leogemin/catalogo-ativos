import { existsSync } from 'node:fs';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';

/**
 * Sobe a aplicação inteira contra um PostgreSQL real. Usa o banco de
 * DB_NAME_TEST (padrão: catalogo_ativos_test), que é limpo a cada teste.
 * Requer o Postgres do docker-compose (ou outro) rodando.
 */
if (existsSync('.env')) process.loadEnvFile('.env');
process.env.DB_NAME = process.env.DB_NAME_TEST ?? 'catalogo_ativos_test';
process.env.DB_MIGRATIONS_RUN = 'true';
process.env.JWT_SECRET ??= 'segredo-dos-testes-e2e-com-32-caracteres-ou-mais';
process.env.ADMIN_PASSWORD = 'admin-e2e-123';

export const ADMIN_PASSWORD: string = process.env.ADMIN_PASSWORD;
export const prefix = () => `/${process.env.API_PREFIX ?? 'api'}`;

export async function createTestApp(): Promise<INestApplication<App>> {
  const { AppModule } = await import('../src/app.module.js');
  const { configureApp } = await import('../src/app.setup.js');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();

  // O banco de testes pode ter um admin de outra execução com outra senha.
  const { UsersService } = await import('../src/modules/users/application/users.service.js');
  await app.get(DataSource).query('DELETE FROM "users"');
  await app.get(UsersService).ensureAdmin(ADMIN_PASSWORD);
  return app;
}

export async function login(app: INestApplication<App>, username: string, password: string): Promise<string> {
  const response = await request(app.getHttpServer())
    .post(`${prefix()}/auth/login`)
    .send({ username, password })
    .expect(200);
  return response.body.accessToken as string;
}
