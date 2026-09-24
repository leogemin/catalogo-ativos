import type { AssetFiltersState, CatalogMode } from '../../types/asset';
import { AlphabetNav } from './AlphabetNav';
import { AssetFilters } from './AssetFilters';
import { NonObjectFilters } from './NonObjectFilters';
import { Tabs } from './Tabs';
import styles from './Toolbar.module.scss';

interface ToolbarProps {
  mode: CatalogMode;
  onModeChange: (mode: CatalogMode) => void;
  assetFilters: AssetFiltersState;
  categories: string[];
  fixations: string[];
  onAssetSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onFixationChange: (value: string) => void;
  onClearAssetFilters: () => void;
  nonObjectSearch: string;
  onNonObjectSearchChange: (value: string) => void;
  onClearNonObjectFilters: () => void;
  activeLetter: string;
  onLetterChange: (letter: string) => void;
}

export function Toolbar({
  mode,
  onModeChange,
  assetFilters,
  categories,
  fixations,
  onAssetSearchChange,
  onCategoryChange,
  onFixationChange,
  onClearAssetFilters,
  nonObjectSearch,
  onNonObjectSearchChange,
  onClearNonObjectFilters,
  activeLetter,
  onLetterChange,
}: ToolbarProps) {
  return (
    <section className={styles.toolbar}>
      <Tabs mode={mode} onChange={onModeChange} />

      {mode === 'assets' ? (
        <AssetFilters
          filters={assetFilters}
          categories={categories}
          fixations={fixations}
          onSearchChange={onAssetSearchChange}
          onCategoryChange={onCategoryChange}
          onFixationChange={onFixationChange}
          onClear={onClearAssetFilters}
        />
      ) : (
        <NonObjectFilters
          search={nonObjectSearch}
          onSearchChange={onNonObjectSearchChange}
          onClear={onClearNonObjectFilters}
        />
      )}

      <AlphabetNav activeLetter={activeLetter} onChange={onLetterChange} />
    </section>
  );
}
