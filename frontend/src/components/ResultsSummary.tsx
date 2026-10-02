import { useTranslation } from 'react-i18next';
import type { CatalogMode, ViewMode } from '../types/asset';
import styles from './ResultsSummary.module.scss';

interface ResultsSummaryProps {
  mode: CatalogMode;
  count: number;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onAddAsset: () => void;
}

export function ResultsSummary({ mode, count, view, onViewChange, onAddAsset }: ResultsSummaryProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const label = mode === 'assets' ? t('results.assetsFound', { count }) : t('results.nonObjectFound', { count });

  return (
    <div className={styles['results-summary']}>
      <div className={styles['results-summary__count']}>
        <strong>{count.toLocaleString(locale)}</strong> {label}
      </div>
      {mode === 'assets' && (
        <div className={styles['results-summary__right']}>
          <div className={styles['results-summary__view-actions']}>
            <button
              type="button"
              className={`${styles['results-summary__view-btn']} ${
                view === 'grid' ? styles['results-summary__view-btn--active'] : ''
              }`}
              onClick={() => onViewChange('grid')}
            >
              ▦ {t('view.grid')}
            </button>
            <button
              type="button"
              className={`${styles['results-summary__view-btn']} ${
                view === 'list' ? styles['results-summary__view-btn--active'] : ''
              }`}
              onClick={() => onViewChange('list')}
            >
              ☰ {t('view.list')}
            </button>
          </div>
          <button type="button" className={styles['results-summary__add-btn']} onClick={onAddAsset}>
            + {t('actions.addAsset')}
          </button>
        </div>
      )}
    </div>
  );
}
