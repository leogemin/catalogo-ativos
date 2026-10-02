import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { CatalogCsvService } from './application/catalog-csv.service.js';
import { CatalogItemsService } from './application/catalog-items.service.js';
import { CatalogTransferService } from './application/catalog-transfer.service.js';
import { CatalogsService } from './application/catalogs.service.js';
import { CatalogItem } from './domain/catalog-item.entity.js';
import { CatalogItemRepository } from './domain/catalog-item.repository.js';
import { Catalog } from './domain/catalog.entity.js';
import { CatalogRepository } from './domain/catalog.repository.js';
import { TypeOrmCatalogItemRepository } from './infrastructure/typeorm-catalog-item.repository.js';
import { TypeOrmCatalogRepository } from './infrastructure/typeorm-catalog.repository.js';
import { CatalogItemsController } from './presentation/catalog-items.controller.js';
import { CatalogsController } from './presentation/catalogs.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Catalog, CatalogItem]),
    // Sem `dest`/`storage`: o multer guarda o upload em memória (file.buffer).
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        limits: { files: 1, fileSize: config.get('CSV_MAX_FILE_SIZE_MB', { infer: true }) * 1024 * 1024 },
      }),
    }),
  ],
  controllers: [CatalogsController, CatalogItemsController],
  providers: [
    CatalogsService,
    CatalogItemsService,
    CatalogTransferService,
    CatalogCsvService,
    // As classes abstratas do domínio são os tokens de injeção; trocar o
    // mecanismo de persistência é trocar só o `useClass`.
    { provide: CatalogRepository, useClass: TypeOrmCatalogRepository },
    { provide: CatalogItemRepository, useClass: TypeOrmCatalogItemRepository },
  ],
  exports: [CatalogsService, CatalogTransferService],
})
export class CatalogsModule {}
