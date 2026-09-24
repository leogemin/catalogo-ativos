import { useMemo } from 'react';
import type { Asset } from '../types/asset';
import { uniqueSorted } from '../utils/text';

/** Deriva as opções de filtro (categorias e fijações) a partir do próprio dataset. */
export function useAssetOptions(assets: Asset[]) {
  return useMemo(() => {
    const categories = uniqueSorted(assets.map((asset) => asset.categoria));
    const fixations = uniqueSorted(assets.map((asset) => asset.fijacion));
    return { categories, fixations };
  }, [assets]);
}
