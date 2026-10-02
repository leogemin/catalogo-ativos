import { Test } from '@nestjs/testing';
import { BusinessRuleError, NotFoundError } from '../../../common/errors/domain.errors.js';
import type { CatalogItem } from '../domain/catalog-item.entity.js';
import { CatalogItemRepository } from '../domain/catalog-item.repository.js';
import { CatalogItemType } from '../domain/catalog-item-type.enum.js';
import type { Catalog } from '../domain/catalog.entity.js';
import { CatalogRepository } from '../domain/catalog.repository.js';
import { CatalogItemsService } from './catalog-items.service.js';
import { CatalogsService } from './catalogs.service.js';

const CATALOG_ID = '0b6b6c1e-2f0a-4a3b-9d7e-6a3f3f1a2b3c';
const ITEM_ID = '8f1d7c52-0e9b-4a7c-8f6e-2d1c3b4a5e6f';

describe('CatalogItemsService', () => {
  let service: CatalogItemsService;
  const catalogRepository = { findById: vi.fn() };
  const itemRepository = { findById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };

  const existingItem = (): CatalogItem => ({
    id: ITEM_ID,
    catalogId: CATALOG_ID,
    type: CatalogItemType.ASSET,
    especie: 'SILLA',
    categoria: 'MUEBLES',
    suplementos: 'MCA/MOD/',
    fijacion: 'FICTICIO',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    catalogRepository.findById.mockResolvedValue({ id: CATALOG_ID, name: 'Teste' } as Catalog);
    itemRepository.findById.mockResolvedValue(existingItem());
    itemRepository.create.mockImplementation((catalogId: string, data: object) => ({ id: 'new', catalogId, ...data }));
    itemRepository.update.mockImplementation((item: object, data: object) => ({ ...item, ...data }));

    // Injeta dublês pelos mesmos tokens (classes abstratas) usados no módulo real.
    const moduleRef = await Test.createTestingModule({
      providers: [
        CatalogItemsService,
        CatalogsService,
        { provide: CatalogRepository, useValue: catalogRepository },
        { provide: CatalogItemRepository, useValue: itemRepository },
      ],
    }).compile();
    service = moduleRef.get(CatalogItemsService);
  });

  it('cria item normalizando texto e aplicando ASSET como tipo padrão', async () => {
    await service.create(CATALOG_ID, { especie: '  MESA ', categoria: 'MUEBLES', suplementos: '—' });

    expect(itemRepository.create).toHaveBeenCalledWith(CATALOG_ID, {
      type: CatalogItemType.ASSET,
      especie: 'MESA',
      categoria: 'MUEBLES',
      suplementos: null,
      fijacion: null,
    });
  });

  it('rejeita ASSET sem categoria com erro de regra de negócio', async () => {
    await expect(service.create(CATALOG_ID, { especie: 'MESA' })).rejects.toBeInstanceOf(BusinessRuleError);
    expect(itemRepository.create).not.toHaveBeenCalled();
  });

  it('falha com NotFound quando o catálogo não existe', async () => {
    catalogRepository.findById.mockResolvedValue(null);
    await expect(service.create(CATALOG_ID, { especie: 'MESA', categoria: 'MUEBLES' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('PATCH mantém campos omitidos e limpa os enviados como null', async () => {
    const updated = await service.update(CATALOG_ID, ITEM_ID, { fijacion: null, suplementos: 'MCA/MOD/SERIE' });

    expect(updated).toMatchObject({
      especie: 'SILLA',
      categoria: 'MUEBLES',
      suplementos: 'MCA/MOD/SERIE',
      fijacion: null,
    });
  });

  it('PATCH revalida o item resultante (ASSET não pode ficar sem categoria)', async () => {
    await expect(service.update(CATALOG_ID, ITEM_ID, { categoria: null })).rejects.toBeInstanceOf(BusinessRuleError);

    // Como NON_OBJECT, categoria vazia é permitida.
    await expect(
      service.update(CATALOG_ID, ITEM_ID, { type: CatalogItemType.NON_OBJECT, categoria: null }),
    ).resolves.toMatchObject({ type: CatalogItemType.NON_OBJECT, categoria: null });
  });

  it('remove só itens que existem no catálogo informado', async () => {
    itemRepository.findById.mockResolvedValue(null);
    await expect(service.remove(CATALOG_ID, ITEM_ID)).rejects.toBeInstanceOf(NotFoundError);
    expect(itemRepository.delete).not.toHaveBeenCalled();
  });
});
