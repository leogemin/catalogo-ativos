import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { Catalog } from '../../types/asset';
import styles from './CatalogSelector.module.scss';

interface CatalogSelectorProps {
  catalogs: Catalog[];
  selectedId: string | null;
  onChange: (catalogId: string) => void;
}

export function CatalogSelector({ catalogs, selectedId, onChange }: CatalogSelectorProps) {
  const { t } = useTranslation();
  const id = useId();

  if (catalogs.length === 0) return null;

  return (
    <div className={styles['catalog-selector']}>
      <label className={styles['catalog-selector__label']} htmlFor={id}>
        {t('catalog.label')}
      </label>
      <select
        id={id}
        className={styles['catalog-selector__select']}
        value={selectedId ?? ''}
        onChange={(event) => onChange(event.target.value)}
        aria-label={t('catalog.label')}
      >
        {catalogs.map((catalog) => (
          <option key={catalog.id} value={catalog.id}>
            {catalog.name}
          </option>
        ))}
      </select>
    </div>
  );
}
