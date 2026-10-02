import { Test } from '@nestjs/testing';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../../common/errors/domain.errors.js';
import { CatalogItemRepository } from '../domain/catalog-item.repository.js';
import { CatalogItemType } from '../domain/catalog-item-type.enum.js';
import type { Catalog } from '../domain/catalog.entity.js';
import { CatalogRepository } from '../domain/catalog.repository.js';
import { CatalogCsvService } from './catalog-csv.service.js';
import { CatalogTransferService } from './catalog-transfer.service.js';
import { CatalogsService } from './catalogs.service.js';

const CATALOG: Catalog = {
  id: '0b6b6c1e-2f0a-4a3b-9d7e-6a3f3f1a2b3c',
  name: 'Catálogo Maestro',
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MIXED_CSV = Buffer.from('tipo,categoria,especie\nASSET,MUEBLES,MESA\nASSET,,SILLA\nNON_OBJECT,,ALFOMBRA\n');

describe('CatalogTransferService', () => {
  let service: CatalogTransferService;
  const catalogRepository = {
    findById: vi.fn(),
    existsByName: vi.fn(),
    createWithItems: vi.fn(),
    countItemsByType: vi.fn(),
  };
  const itemRepository = { bulkImport: vi.fn(), findAll: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    catalogRepository.findById.mockResolvedValue(CATALOG);
    catalogRepository.existsByName.mockResolvedValue(false);
    catalogRepository.createWithItems.mockResolvedValue(CATALOG);
    catalogRepository.countItemsByType.mockResolvedValue(new Map([[CATALOG.id, { assets: 1, nonObjects: 1 }]]));
    itemRepository.bulkImport.mockImplementation((_id: string, items: unknown[]) => items.length);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CatalogTransferService,
        CatalogsService,
        CatalogCsvService,
        { provide: CatalogRepository, useValue: catalogRepository },
        { provide: CatalogItemRepository, useValue: itemRepository },
      ],
    }).compile();
    service = moduleRef.get(CatalogTransferService);
  });

  it('por padrão aborta tudo se houver linha inválida, informando a linha', async () => {
    const error: unknown = await service.importIntoCatalog(CATALOG.id, MIXED_CSV, 'replace').then(
      () => undefined,
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(BusinessRuleError);
    expect((error as BusinessRuleError).details).toMatchObject({ invalidRows: 1, errors: [{ line: 3 }] });
    expect(itemRepository.bulkImport).not.toHaveBeenCalled();
  });

  it('com skipInvalid importa só as linhas válidas e reporta as puladas', async () => {
    const report = await service.importIntoCatalog(CATALOG.id, MIXED_CSV, 'append', { skipInvalid: true });

    expect(report).toMatchObject({ mode: 'append', totalRows: 3, imported: 2, skipped: 1 });
    expect(itemRepository.bulkImport).toHaveBeenCalledWith(
      CATALOG.id,
      [
        expect.objectContaining({ especie: 'MESA', type: CatalogItemType.ASSET }),
        expect.objectContaining({ especie: 'ALFOMBRA', type: CatalogItemType.NON_OBJECT }),
      ],
      'append',
    );
  });

  it('não chama o repositório se nenhuma linha for válida (evita replace esvaziar o catálogo)', async () => {
    await expect(
      service.importIntoCatalog(CATALOG.id, Buffer.from('especie,categoria\nMESA,\n'), 'replace', {
        skipInvalid: true,
      }),
    ).rejects.toBeInstanceOf(BusinessRuleError);
    expect(itemRepository.bulkImport).not.toHaveBeenCalled();
  });

  it('importação em catálogo inexistente responde NotFound antes de ler o arquivo', async () => {
    catalogRepository.findById.mockResolvedValue(null);
    await expect(service.importIntoCatalog(CATALOG.id, MIXED_CSV, 'append')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('criar catálogo por CSV respeita a unicidade do nome', async () => {
    catalogRepository.existsByName.mockResolvedValue(true);
    await expect(
      service.importAsNewCatalog(Buffer.from('especie,categoria\nMESA,MUEBLES\n'), { name: 'Dup', description: null }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(catalogRepository.createWithItems).not.toHaveBeenCalled();
  });

  it('exporta com nome de arquivo seguro e delimitador escolhido', async () => {
    itemRepository.findAll.mockResolvedValue([
      { type: CatalogItemType.ASSET, categoria: 'MUEBLES', especie: 'MESA', suplementos: null, fijacion: null },
    ]);

    const result = await service.exportCatalog(CATALOG.id, { delimiter: ';' });

    expect(result.filename).toBe('catalogo-maestro.csv');
    expect(result.content).toBe('﻿tipo;categoria;especie;suplementos;fijacion\r\nASSET;MUEBLES;MESA;;\r\n');
  });
});
