import { fetchCatalogFacets, fetchCatalogItems, fetchCatalogs } from '../services/catalogService';
import type { CatalogItemsQuery } from '../types/asset';
import { useAsyncResource } from './useAsyncResource';

export function useCatalogs() {
  return useAsyncResource('catalogs', (signal) => fetchCatalogs(signal));
}

/** `catalogId = null` desabilita a busca (ex.: aba inativa ou nenhum catálogo). */
export function useCatalogItems(catalogId: string | null, query: CatalogItemsQuery) {
  const key = catalogId ? `items:${catalogId}:${JSON.stringify(query)}` : null;
  return useAsyncResource(key, (signal) => fetchCatalogItems(catalogId!, query, signal));
}

export function useCatalogFacets(catalogId: string | null) {
  const key = catalogId ? `facets:${catalogId}` : null;
  return useAsyncResource(key, (signal) => fetchCatalogFacets(catalogId!, signal));
}
