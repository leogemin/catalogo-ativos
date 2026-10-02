import { useTranslation } from 'react-i18next';
import type { CatalogMode } from '../../types/asset';
import styles from './Tabs.module.scss';

interface TabsProps {
  mode: CatalogMode;
  onChange: (mode: CatalogMode) => void;
}

export function Tabs({ mode, onChange }: TabsProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.tabs}>
      <button
        type="button"
        className={`${styles.tabs__tab} ${mode === 'assets' ? styles['tabs__tab--active'] : ''}`}
        onClick={() => onChange('assets')}
      >
        {t('tabs.assets')}
      </button>
      <button
        type="button"
        className={`${styles.tabs__tab} ${mode === 'non-object' ? styles['tabs__tab--active'] : ''}`}
        onClick={() => onChange('non-object')}
      >
        {t('tabs.nonObject')}
      </button>
    </div>
  );
}
