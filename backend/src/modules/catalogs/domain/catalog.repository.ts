import type { NewCatalogItem } from './catalog-item.entity.js';
import type { Catalog, NewCatalog } from './catalog.entity.js';

export interface CatalogItemCounts {
  assets: number;
  nonObjects: number;
}

export interface CatalogPageQuery {
  search?: string;
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}

/**
 * Contrato de persistência de catálogos. A camada de aplicação depende só
 * desta abstração (a classe abstrata serve de token de injeção no Nest);
 * a implementação TypeORM fica em `infrastructure/`.
 */
export abstract class CatalogRepository {
  abstract findPage(query: CatalogPageQuery): Promise<Page<Catalog>>;
  abstract findById(id: string): Promise<Catalog | null>;
  abstract existsByName(name: string, excludeId?: string): Promise<boolean>;
  abstract countItemsByType(catalogIds: string[]): Promise<Map<string, CatalogItemCounts>>;
  abstract create(data: NewCatalog): Promise<Catalog>;
  abstract update(catalog: Catalog, changes: Partial<NewCatalog>): Promise<Catalog>;
  abstract delete(id: string): Promise<void>;
  /** Cria o catálogo e todos os itens numa única transação. */
  abstract createWithItems(data: NewCatalog, items: NewCatalogItem[]): Promise<Catalog>;
}
