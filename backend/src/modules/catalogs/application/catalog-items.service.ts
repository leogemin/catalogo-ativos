import { Injectable } from '@nestjs/common';
import { BusinessRuleError, NotFoundError } from '../../../common/errors/domain.errors.js';
import type { CatalogItem } from '../domain/catalog-item.entity.js';
import {
  type CatalogFacets,
  type CatalogItemPageQuery,
  CatalogItemRepository,
} from '../domain/catalog-item.repository.js';
import { type CatalogItemDraft, validateCatalogItem } from '../domain/catalog-item.rules.js';
import type { Page } from '../domain/catalog.repository.js';
import { CatalogsService } from './catalogs.service.js';

@Injectable()
export class CatalogItemsService {
  constructor(
    private readonly items: CatalogItemRepository,
    private readonly catalogs: CatalogsService,
  ) {}

  async list(catalogId: string, query: CatalogItemPageQuery): Promise<Page<CatalogItem>> {
    await this.catalogs.findEntityOrFail(catalogId);
    return this.items.findPage(catalogId, query);
  }

  async facets(catalogId: string): Promise<CatalogFacets> {
    await this.catalogs.findEntityOrFail(catalogId);
    return this.items.facets(catalogId);
  }

  async get(catalogId: string, itemId: string): Promise<CatalogItem> {
    await this.catalogs.findEntityOrFail(catalogId);
    const item = await this.items.findById(catalogId, itemId);
    if (!item) throw new NotFoundError(`Item ${itemId} não encontrado no catálogo ${catalogId}.`);
    return item;
  }

  async create(catalogId: string, draft: CatalogItemDraft): Promise<CatalogItem> {
    await this.catalogs.findEntityOrFail(catalogId);
    return this.items.create(catalogId, this.validate(draft));
  }

  /** PATCH: campo ausente (`undefined`) mantém o valor atual; `null` limpa. */
  async update(catalogId: string, itemId: string, patch: CatalogItemDraft): Promise<CatalogItem> {
    const item = await this.get(catalogId, itemId);
    const merged: CatalogItemDraft = {
      type: patch.type ?? item.type,
      especie: patch.especie !== undefined ? patch.especie : item.especie,
      categoria: patch.categoria !== undefined ? patch.categoria : item.categoria,
      suplementos: patch.suplementos !== undefined ? patch.suplementos : item.suplementos,
      fijacion: patch.fijacion !== undefined ? patch.fijacion : item.fijacion,
    };
    return this.items.update(item, this.validate(merged));
  }

  async remove(catalogId: string, itemId: string): Promise<void> {
    await this.items.delete(await this.get(catalogId, itemId));
  }

  private validate(draft: CatalogItemDraft) {
    const result = validateCatalogItem(draft);
    if (!result.ok) throw new BusinessRuleError('Item de catálogo inválido.', { errors: result.errors });
    return result.item;
  }
}
