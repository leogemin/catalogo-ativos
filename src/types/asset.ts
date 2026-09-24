export interface Asset {
  id: string;
  categoria: string;
  especie: string;
  suplementos: string;
  fijacion: string;
}

/** Dados de um ativo sem o identificador — usado nos formulários de criação/edição. */
export type AssetInput = Omit<Asset, 'id'>;

export type NonObjectItem = string;

export type AssetFormMode = 'create' | 'edit';

export type CatalogMode = 'assets' | 'non-object';
export type ViewMode = 'grid' | 'list';

export interface AssetFiltersState {
  search: string;
  category: string;
  fixation: string;
  letter: string;
}

export interface NonObjectFiltersState {
  search: string;
  letter: string;
}
