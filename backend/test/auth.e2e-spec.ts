import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { ADMIN_PASSWORD, createTestApp, login, prefix } from './e2e-setup.js';

describe('Autenticação e usuários (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  beforeEach(async () => {
    // Mantém só o admin, criado na subida da aplicação a partir de ADMIN_PASSWORD.
    await app.get(DataSource).query(`DELETE FROM "users" WHERE "username" <> 'admin'`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('bloqueia rotas sem token ou com token inválido', async () => {
    const missing = await http.get(`${prefix()}/catalogs`).expect(401);
    expect(missing.body).toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });

    await http.get(`${prefix()}/catalogs`).auth('token-invalido', { type: 'bearer' }).expect(401);
  });

  it('login devolve token e o usuário; credenciais erradas dão 401', async () => {
    const response = await http
      .post(`${prefix()}/auth/login`)
      .send({ username: 'ADMIN', password: ADMIN_PASSWORD })
      .expect(200);
    expect(response.body).toMatchObject({ tokenType: 'Bearer', user: { username: 'admin', isAdmin: true } });

    const me = await http.get(`${prefix()}/auth/me`).auth(response.body.accessToken, { type: 'bearer' }).expect(200);
    expect(me.body).toMatchObject({ username: 'admin', isAdmin: true });

    const wrong = await http.post(`${prefix()}/auth/login`).send({ username: 'admin', password: 'errada' }).expect(401);
    expect(wrong.body.code).toBe('UNAUTHORIZED');
  });

  it('só o admin cadastra usuários; o novo usuário loga mas não gerencia usuários', async () => {
    const adminToken = await login(app, 'admin', ADMIN_PASSWORD);

    const created = await http
      .post(`${prefix()}/users`)
      .auth(adminToken, { type: 'bearer' })
      .send({ username: 'Maria.Perez', password: 'segredo123' })
      .expect(201);
    expect(created.body).toMatchObject({ username: 'maria.perez', isAdmin: false });
    expect(created.body).not.toHaveProperty('passwordHash');

    await http
      .post(`${prefix()}/users`)
      .auth(adminToken, { type: 'bearer' })
      .send({ username: 'maria.perez', password: 'outra-senha' })
      .expect(409);

    const userToken = await login(app, 'maria.perez', 'segredo123');
    await http.get(`${prefix()}/catalogs`).auth(userToken, { type: 'bearer' }).expect(200);

    const forbidden = await http
      .post(`${prefix()}/users`)
      .auth(userToken, { type: 'bearer' })
      .send({ username: 'joao', password: 'segredo123' })
      .expect(403);
    expect(forbidden.body.code).toBe('FORBIDDEN');
    await http.get(`${prefix()}/users`).auth(userToken, { type: 'bearer' }).expect(403);

    const list = await http.get(`${prefix()}/users`).auth(adminToken, { type: 'bearer' }).expect(200);
    expect(list.body.map((user: { username: string }) => user.username)).toEqual(['admin', 'maria.perez']);

    // Usuário removido perde o acesso mesmo com token ainda válido.
    await http.delete(`${prefix()}/users/${created.body.id}`).auth(adminToken, { type: 'bearer' }).expect(204);
    await http.get(`${prefix()}/catalogs`).auth(userToken, { type: 'bearer' }).expect(401);
  });

  it('valida o cadastro e protege o admin de remoção', async () => {
    const adminToken = await login(app, 'admin', ADMIN_PASSWORD);

    const invalid = await http
      .post(`${prefix()}/users`)
      .auth(adminToken, { type: 'bearer' })
      .send({ username: 'a b', password: '123' })
      .expect(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');

    const me = await http.get(`${prefix()}/auth/me`).auth(adminToken, { type: 'bearer' });
    await http.delete(`${prefix()}/users/${me.body.id}`).auth(adminToken, { type: 'bearer' }).expect(422);
  });
});
