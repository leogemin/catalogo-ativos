import type { Asset, AssetInput, Catalog, CatalogFacets, CatalogItemsQuery, Page } from '../types/asset';
import { apiRequest } from './apiClient';

// Teto do backend para pageSize; a UI não espera centenas de catálogos.
const CATALOGS_PAGE_SIZE = 500;

export async function fetchCatalogs(signal?: AbortSignal): Promise<Catalog[]> {
  const page = await apiRequest<Page<Catalog>>('/catalogs', { query: { pageSize: CATALOGS_PAGE_SIZE }, signal });
  return page.data;
}

export function fetchCatalogItems(catalogId: string, query: CatalogItemsQuery, signal?: AbortSignal): Promise<Page<Asset>> {
  return apiRequest<Page<Asset>>(`/catalogs/${catalogId}/items`, { query, signal });
}

export function fetchCatalogFacets(catalogId: string, signal?: AbortSignal): Promise<CatalogFacets> {
  return apiRequest<CatalogFacets>(`/catalogs/${catalogId}/items/facets`, { signal });
}

export function createCatalogItem(catalogId: string, input: AssetInput): Promise<Asset> {
  return apiRequest<Asset>(`/catalogs/${catalogId}/items`, { method: 'POST', body: { type: 'ASSET', ...input } });
}

export function updateCatalogItem(catalogId: string, itemId: string, input: AssetInput): Promise<Asset> {
  return apiRequest<Asset>(`/catalogs/${catalogId}/items/${itemId}`, { method: 'PATCH', body: input });
}
