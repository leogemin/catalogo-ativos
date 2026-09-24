import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { AssetFiltersState } from '../../types/asset';
import { SearchIcon } from './SearchIcon';
import styles from './AssetFilters.module.scss';

interface AssetFiltersProps {
  filters: AssetFiltersState;
  categories: string[];
  fixations: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onFixationChange: (value: string) => void;
  onClear: () => void;
}

export function AssetFilters({
  filters,
  categories,
  fixations,
  onSearchChange,
  onCategoryChange,
  onFixationChange,
  onClear,
}: AssetFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className={styles['asset-filters']}>
      <div className={styles['asset-filters__search']}>
        <SearchIcon />
        <input
          value={filters.search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder={t('filters.searchPlaceholder')}
          autoComplete="off"
          aria-label={t('filters.searchPlaceholder')}
        />
      </div>
      <select
        value={filters.category}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onCategoryChange(event.target.value)}
        aria-label={t('filters.allCategories')}
      >
        <option value="">{t('filters.allCategories')}</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <select
        value={filters.fixation}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onFixationChange(event.target.value)}
        aria-label={t('filters.allFixations')}
      >
        <option value="">{t('filters.allFixations')}</option>
        {fixations.map((fixation) => (
          <option key={fixation} value={fixation}>
            {fixation}
          </option>
        ))}
      </select>
      <button type="button" className={styles['asset-filters__clear']} onClick={onClear}>
        {t('filters.clear')}
      </button>
    </div>
  );
}
