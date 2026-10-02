import type { CatalogItem, NewCatalogItem } from './catalog-item.entity.js';
import type { CatalogItemType } from './catalog-item-type.enum.js';
import type { Page } from './catalog.repository.js';

export type CatalogItemSortField = 'especie' | 'categoria' | 'createdAt';
export type SortOrder = 'ASC' | 'DESC';
export type ImportMode = 'append' | 'replace';

export interface CatalogItemFilters {
  type?: CatalogItemType;
  /** Busca sem acento/caixa em especie + categoria + suplementos + fijacion. */
  search?: string;
  categoria?: string;
  fijacion?: string;
  /** Letra inicial da especie (A–Z), sem acento. */
  letter?: string;
}

export interface CatalogItemPageQuery extends CatalogItemFilters {
  page: number;
  pageSize: number;
  sortBy: CatalogItemSortField;
  order: SortOrder;
}

export interface CatalogFacets {
  categories: string[];
  fixations: string[];
  counts: { assets: number; nonObjects: number };
}

export abstract class CatalogItemRepository {
  abstract findPage(catalogId: string, query: CatalogItemPageQuery): Promise<Page<CatalogItem>>;
  abstract findAll(catalogId: string, type?: CatalogItemType): Promise<CatalogItem[]>;
  abstract findById(catalogId: string, id: string): Promise<CatalogItem | null>;
  abstract facets(catalogId: string): Promise<CatalogFacets>;
  abstract create(catalogId: string, data: NewCatalogItem): Promise<CatalogItem>;
  abstract update(item: CatalogItem, data: NewCatalogItem): Promise<CatalogItem>;
  abstract delete(item: CatalogItem): Promise<void>;
  /** Insere itens em lote numa transação; em `replace`, apaga os existentes antes. */
  abstract bulkImport(catalogId: string, items: NewCatalogItem[], mode: ImportMode): Promise<number>;
}
