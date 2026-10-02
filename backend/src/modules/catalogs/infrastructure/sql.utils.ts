import type { EntityManager } from 'typeorm';
import { CatalogItem, type NewCatalogItem } from '../domain/catalog-item.entity.js';

/** Escapa curingas do LIKE (`%`, `_`, `\`) para buscar o texto literal. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// 7 colunas por linha × 1000 linhas fica bem abaixo do limite de 65535
// parâmetros por statement do PostgreSQL.
const INSERT_CHUNK_SIZE = 1000;

export async function insertCatalogItems(
  manager: EntityManager,
  catalogId: string,
  items: NewCatalogItem[],
): Promise<void> {
  for (let start = 0; start < items.length; start += INSERT_CHUNK_SIZE) {
    const chunk = items.slice(start, start + INSERT_CHUNK_SIZE).map((item) => ({ ...item, catalogId }));
    await manager.createQueryBuilder().insert().into(CatalogItem).values(chunk).execute();
  }
}
