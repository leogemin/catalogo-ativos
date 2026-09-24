import { useMemo } from 'react';
import type { Asset, AssetFiltersState, NonObjectFiltersState } from '../types/asset';
import { normalize } from '../utils/text';

export function useFilteredAssets(assets: Asset[], filters: AssetFiltersState): Asset[] {
  return useMemo(() => {
    const query = normalize(filters.search);
    return assets.filter((asset) => {
      const matchesQuery =
        !query ||
        normalize([asset.especie, asset.categoria, asset.suplementos, asset.fijacion].join(' ')).includes(
          query,
        );
      const matchesCategory = !filters.category || asset.categoria === filters.category;
      const matchesFixation = !filters.fixation || asset.fijacion === filters.fixation;
      const matchesLetter = !filters.letter || normalize(asset.especie).startsWith(filters.letter);
      return matchesQuery && matchesCategory && matchesFixation && matchesLetter;
    });
  }, [assets, filters.search, filters.category, filters.fixation, filters.letter]);
}

export function useFilteredNonObjectItems(items: string[], filters: NonObjectFiltersState): string[] {
  return useMemo(() => {
    const query = normalize(filters.search);
    return items.filter((item) => {
      const matchesQuery = !query || normalize(item).includes(query);
      const matchesLetter = !filters.letter || normalize(item).startsWith(filters.letter);
      return matchesQuery && matchesLetter;
    });
  }, [items, filters.search, filters.letter]);
}
