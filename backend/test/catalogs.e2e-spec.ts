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

const { AppModule } = await import('../src/app.module.js');
const { configureApp } = await import('../src/app.setup.js');

const SAMPLE_CSV =
  'tipo;categoria;especie;suplementos;fijacion\n' +
  'ASSET;MUEBLES;ACONDICIONADOR DE AIRE;MCA/MOD/POTENCIA EN BTU/H;A CERCA DE LA PLACA DEL FABRICANTE O FICTÍCIO\n' +
  'ASSET;EQUIPOS DE COMPUTO;ACCESS POINT;MCA/MOD/;—\n' +
  'NON_OBJECT;;ALFOMBRA - BIEN NO OBJETO;;\n';

describe('Catálogos (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  const prefix = () => `/${process.env.API_PREFIX ?? 'api'}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  beforeEach(async () => {
    await app.get(DataSource).query('TRUNCATE TABLE "catalogs" CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  async function createCatalog(name = 'Catálogo E2E'): Promise<string> {
    const response = await http.post(`${prefix()}/catalogs`).send({ name }).expect(201);
    return response.body.id as string;
  }

  it('importa CSV, filtra sem acento, exporta e reimporta com o mesmo conteúdo', async () => {
    const catalogId = await createCatalog();

    const report = await http
      .post(`${prefix()}/catalogs/${catalogId}/import`)
      .attach('file', Buffer.from(SAMPLE_CSV), 'amostra.csv')
      .expect(200);
    expect(report.body).toMatchObject({ mode: 'append', imported: 3, skipped: 0 });

    const search = await http
      .get(`${prefix()}/catalogs/${catalogId}/items`)
      .query({ search: 'ficticio', type: 'ASSET' })
      .expect(200);
    expect(search.body.data.map((item: { especie: string }) => item.especie)).toEqual(['ACONDICIONADOR DE AIRE']);

    const facets = await http.get(`${prefix()}/catalogs/${catalogId}/items/facets`).expect(200);
    expect(facets.body).toEqual({
      categories: ['EQUIPOS DE COMPUTO', 'MUEBLES'],
      fixations: ['A CERCA DE LA PLACA DEL FABRICANTE O FICTÍCIO'],
      counts: { assets: 2, nonObjects: 1 },
    });

    const exported = await http.get(`${prefix()}/catalogs/${catalogId}/export`).expect(200);
    expect(exported.headers['content-type']).toContain('text/csv');
    expect(exported.headers['content-disposition']).toContain('catalogo-e2e.csv');

    const copy = await http
      .post(`${prefix()}/catalogs/import`)
      .field('name', 'Cópia')
      .attach('file', Buffer.from(exported.text), 'copia.csv')
      .expect(201);
    expect(copy.body.catalog.itemCounts).toEqual({ assets: 2, nonObjects: 1 });
  });

  it('replace troca todos os itens numa transação; import inválido não altera nada', async () => {
    const catalogId = await createCatalog();
    await http.post(`${prefix()}/catalogs/${catalogId}/import`).attach('file', Buffer.from(SAMPLE_CSV), 'a.csv');

    const invalid = await http
      .post(`${prefix()}/catalogs/${catalogId}/import`)
      .query({ mode: 'replace' })
      .attach('file', Buffer.from('especie,categoria\nMESA,\n'), 'b.csv')
      .expect(422);
    expect(invalid.body).toMatchObject({ code: 'BUSINESS_RULE_VIOLATION', details: { errors: [{ line: 2 }] } });
    expect((await http.get(`${prefix()}/catalogs/${catalogId}`)).body.itemCounts).toEqual({ assets: 2, nonObjects: 1 });

    await http
      .post(`${prefix()}/catalogs/${catalogId}/import`)
      .query({ mode: 'replace' })
      .attach('file', Buffer.from('especie,categoria\nMESA,MUEBLES\n'), 'c.csv')
      .expect(200);
    expect((await http.get(`${prefix()}/catalogs/${catalogId}`)).body.itemCounts).toEqual({ assets: 1, nonObjects: 0 });
  });

  it('CRUD de item com PATCH parcial e remoção em cascata do catálogo', async () => {
    const catalogId = await createCatalog();
    const items = `${prefix()}/catalogs/${catalogId}/items`;

    const created = await http.post(items).send({ especie: 'Escáner', categoria: 'EQUIPOS DE COMPUTO' }).expect(201);
    const patched = await http.patch(`${items}/${created.body.id}`).send({ fijacion: 'FICTICIO' }).expect(200);
    expect(patched.body).toMatchObject({ especie: 'Escáner', categoria: 'EQUIPOS DE COMPUTO', fijacion: 'FICTICIO' });

    await http.delete(`${prefix()}/catalogs/${catalogId}`).expect(204);
    await http.get(`${items}/${created.body.id}`).expect(404);
  });

  it('responde erros sempre no mesmo formato { statusCode, code, message, details }', async () => {
    const validation = await http.post(`${prefix()}/catalogs`).send({ name: '' }).expect(400);
    expect(validation.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { errors: ['name should not be empty'] },
    });

    const badUuid = await http.get(`${prefix()}/catalogs/xyz`).expect(400);
    expect(badUuid.body).toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });

    await createCatalog('Único');
    const conflict = await http.post(`${prefix()}/catalogs`).send({ name: 'ÚNICO' }).expect(409);
    expect(conflict.body.code).toBe('CONFLICT');
  });
});
