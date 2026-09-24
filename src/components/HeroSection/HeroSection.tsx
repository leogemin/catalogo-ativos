import { useTranslation } from 'react-i18next';
import { StatsPanel } from './StatsPanel';
import styles from './HeroSection.module.scss';

interface HeroSectionProps {
  assetsCount: number;
  categoriesCount: number;
  fixationsCount: number;
  nonObjectCount: number;
}

export function HeroSection(props: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section className={styles.hero}>
      <div className={styles.hero__main}>
        <div className={styles.hero__eyebrow}>{t('hero.eyebrow')}</div>
        <h2 className={styles.hero__title}>{t('hero.title')}</h2>
        <p className={styles.hero__description}>{t('hero.description')}</p>
      </div>
      <StatsPanel {...props} />
    </section>
  );
}
