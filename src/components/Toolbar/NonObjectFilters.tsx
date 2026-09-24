import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon } from './SearchIcon';
import styles from './NonObjectFilters.module.scss';

interface NonObjectFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
}

export function NonObjectFilters({ search, onSearchChange, onClear }: NonObjectFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className={styles['non-object-filters']}>
      <div className={styles['non-object-filters__search']}>
        <SearchIcon />
        <input
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder={t('filters.searchNonPlaceholder')}
          autoComplete="off"
          aria-label={t('filters.searchNonPlaceholder')}
        />
      </div>
      <button type="button" className={styles['non-object-filters__clear']} onClick={onClear}>
        {t('filters.clearSearch')}
      </button>
    </div>
  );
}
