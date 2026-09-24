import { useTranslation } from 'react-i18next';
import styles from './HeroSection.module.scss';

interface StatsPanelProps {
  assetsCount: number;
  categoriesCount: number;
  fixationsCount: number;
  nonObjectCount: number;
}

export function StatsPanel({
  assetsCount,
  categoriesCount,
  fixationsCount,
  nonObjectCount,
}: StatsPanelProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const items: Array<{ key: string; value: number; label: string }> = [
    { key: 'assets', value: assetsCount, label: t('stats.assets') },
    { key: 'categories', value: categoriesCount, label: t('stats.categories') },
    { key: 'fixations', value: fixationsCount, label: t('stats.fixations') },
    { key: 'nonObject', value: nonObjectCount, label: t('stats.nonObject') },
  ];

  return (
    <div className={styles.stats}>
      {items.map((item) => (
        <div className={styles.stats__item} key={item.key}>
          <div className={styles.stats__number}>{item.value.toLocaleString(locale)}</div>
          <div className={styles.stats__label}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}
