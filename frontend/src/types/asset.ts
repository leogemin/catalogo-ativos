export type CatalogItemType = 'ASSET' | 'NON_OBJECT';

export interface Catalog {
  id: string;
  name: string;
  description: string | null;
  itemCounts: { assets: number; nonObjects: number };
}

/** Item de catálogo como a API devolve: ativo (ASSET) ou bien no objeto (NON_OBJECT). */
export interface Asset {
  id: string;
  catalogId: string;
  type: CatalogItemType;
  especie: string;
  categoria: string | null;
  suplementos: string | null;
  fijacion: string | null;
}

/** Corpo de criação/edição de um item; `null` limpa o campo. */
export interface AssetInput {
  especie: string;
  categoria: string | null;
  suplementos: string | null;
  fijacion: string | null;
}

export interface CatalogFacets {
  categories: string[];
  fixations: string[];
  counts: { assets: number; nonObjects: number };
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

export interface CatalogItemsQuery {
  type: CatalogItemType;
  page: number;
  pageSize: number;
  search?: string;
  categoria?: string;
  fijacion?: string;
  letter?: string;
}

export type AssetFormMode = 'create' | 'edit';

export type CatalogMode = 'assets' | 'non-object';
export type ViewMode = 'grid' | 'list';

export interface AssetFiltersState {
  search: string;
  category: string;
  fixation: string;
  letter: string;
}
