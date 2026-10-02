import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { ConflictError } from '../common/errors/domain.errors.js';
import { CatalogTransferService } from '../modules/catalogs/application/catalog-transfer.service.js';

const DEFAULT_CSV = 'seeds/catalogo-maestro.csv';
const DEFAULT_NAME = 'Catálogo Maestro de Activos';

/**
 * Popula o banco com o catálogo original do protótipo, reaproveitando o
 * mesmo serviço de importação da API.
 * Uso: npm run seed [-- <arquivo.csv> [nome do catálogo]]
 */
async function seed() {
  const [csvPath = DEFAULT_CSV, name = DEFAULT_NAME] = process.argv.slice(2);
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const transfer = app.get(CatalogTransferService);
    const { catalog, report } = await transfer.importAsNewCatalog(readFileSync(resolve(csvPath)), {
      name,
      description: 'Base integrada a partir do catálogo fornecido pela Ciclo Consultoria.',
    });
    // console.log: o contexto sobe com logger só de warn/error para não poluir a saída.
    console.log(
      `Catálogo "${catalog.catalog.name}" criado (${catalog.catalog.id}): ${report.imported} itens ` +
        `(${catalog.counts.assets} ativos, ${catalog.counts.nonObjects} não objeto).`,
    );
  } catch (error) {
    if (error instanceof ConflictError) {
      logger.warn(`${error.message} Nada a fazer.`);
      return;
    }
    throw error;
  } finally {
    await app.close();
  }
}
await seed();
