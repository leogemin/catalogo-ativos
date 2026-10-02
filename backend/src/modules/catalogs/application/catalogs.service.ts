import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../common/errors/domain.errors.js';
import type { Catalog, NewCatalog } from '../domain/catalog.entity.js';
import {
  type CatalogItemCounts,
  type CatalogPageQuery,
  CatalogRepository,
  type Page,
} from '../domain/catalog.repository.js';

export interface CatalogWithCounts {
  catalog: Catalog;
  counts: CatalogItemCounts;
}

export interface CatalogChanges {
  name?: string;
  description?: string | null;
}

const EMPTY_COUNTS: CatalogItemCounts = { assets: 0, nonObjects: 0 };

@Injectable()
export class CatalogsService {
  constructor(private readonly catalogs: CatalogRepository) {}

  async list(query: CatalogPageQuery): Promise<Page<CatalogWithCounts>> {
    const page = await this.catalogs.findPage(query);
    const counts = await this.catalogs.countItemsByType(page.items.map((catalog) => catalog.id));
    return {
      total: page.total,
      items: page.items.map((catalog) => ({ catalog, counts: counts.get(catalog.id) ?? EMPTY_COUNTS })),
    };
  }

  async get(id: string): Promise<CatalogWithCounts> {
    return this.withCounts(await this.findEntityOrFail(id));
  }

  async create(data: NewCatalog): Promise<CatalogWithCounts> {
    await this.assertNameAvailable(data.name);
    const catalog = await this.catalogs.create(data);
    return { catalog, counts: { ...EMPTY_COUNTS } };
  }

  async update(id: string, changes: CatalogChanges): Promise<CatalogWithCounts> {
    const catalog = await this.findEntityOrFail(id);
    if (changes.name !== undefined && changes.name.toLowerCase() !== catalog.name.toLowerCase()) {
      await this.assertNameAvailable(changes.name, id);
    }
    return this.withCounts(await this.catalogs.update(catalog, changes));
  }

  async remove(id: string): Promise<void> {
    await this.findEntityOrFail(id);
    await this.catalogs.delete(id);
  }

  async findEntityOrFail(id: string): Promise<Catalog> {
    const catalog = await this.catalogs.findById(id);
    if (!catalog) throw new NotFoundError(`Catálogo ${id} não encontrado.`);
    return catalog;
  }

  async assertNameAvailable(name: string, excludeId?: string): Promise<void> {
    if (await this.catalogs.existsByName(name, excludeId)) {
      throw new ConflictError(`Já existe um catálogo com o nome "${name}".`);
    }
  }

  private async withCounts(catalog: Catalog): Promise<CatalogWithCounts> {
    const counts = await this.catalogs.countItemsByType([catalog.id]);
    return { catalog, counts: counts.get(catalog.id) ?? { ...EMPTY_COUNTS } };
  }
}
