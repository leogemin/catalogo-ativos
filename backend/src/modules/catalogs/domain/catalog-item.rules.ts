import { CATALOG_ITEM_LIMITS, type NewCatalogItem } from './catalog-item.entity.js';
import { CatalogItemType } from './catalog-item-type.enum.js';

export interface CatalogItemDraft {
  type?: CatalogItemType | null;
  especie?: string | null;
  categoria?: string | null;
  suplementos?: string | null;
  fijacion?: string | null;
}

export type CatalogItemValidation = { ok: true; item: NewCatalogItem } | { ok: false; errors: string[] };

// O dataset original usa "—" para "sem valor"; no banco isso vira NULL.
const EMPTY_MARKERS = new Set(['', '—', '–', '-']);

export function toNullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return EMPTY_MARKERS.has(trimmed) ? null : trimmed;
}

/**
 * Normaliza e valida um item de catálogo. Regra única usada tanto pelo CRUD
 * quanto pela importação CSV, para que ambos aceitem/rejeitem as mesmas coisas.
 */
export function validateCatalogItem(draft: CatalogItemDraft): CatalogItemValidation {
  const type = draft.type ?? CatalogItemType.ASSET;
  const especie = toNullableText(draft.especie);
  const categoria = toNullableText(draft.categoria);
  const suplementos = toNullableText(draft.suplementos);
  const fijacion = toNullableText(draft.fijacion);

  const errors: string[] = [];
  if (!Object.values(CatalogItemType).includes(type)) errors.push(`tipo inválido: "${String(type)}"`);
  if (!especie) errors.push('especie é obrigatória');
  if (type === CatalogItemType.ASSET && !categoria) errors.push('categoria é obrigatória para itens do tipo ASSET');

  const lengths: Array<[keyof typeof CATALOG_ITEM_LIMITS, string | null]> = [
    ['especie', especie],
    ['categoria', categoria],
    ['suplementos', suplementos],
    ['fijacion', fijacion],
  ];
  for (const [field, value] of lengths) {
    if (value && value.length > CATALOG_ITEM_LIMITS[field]) {
      errors.push(`${field} excede ${CATALOG_ITEM_LIMITS[field]} caracteres`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, item: { type, especie: especie!, categoria, suplementos, fijacion } };
}
