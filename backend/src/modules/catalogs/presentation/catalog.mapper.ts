import type { CatalogWithCounts } from '../application/catalogs.service.js';
import type { CatalogItem } from '../domain/catalog-item.entity.js';
import type { CatalogItemResponseDto } from './dto/catalog-item.dto.js';
import type { CatalogResponseDto } from './dto/catalog.dto.js';

export function toCatalogResponse({ catalog, counts }: CatalogWithCounts): CatalogResponseDto {
  return {
    id: catalog.id,
    name: catalog.name,
    description: catalog.description,
    itemCounts: { assets: counts.assets, nonObjects: counts.nonObjects },
    createdAt: catalog.createdAt,
    updatedAt: catalog.updatedAt,
  };
}

export function toCatalogItemResponse(item: CatalogItem): CatalogItemResponseDto {
  return {
    id: item.id,
    catalogId: item.catalogId,
    type: item.type,
    especie: item.especie,
    categoria: item.categoria,
    suplementos: item.suplementos,
    fijacion: item.fijacion,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
