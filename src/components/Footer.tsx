import { useTranslation } from 'react-i18next';
import styles from './Footer.module.scss';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <span>{t('footer.source')}</span>
      <span>{t('footer.offline')}</span>
    </footer>
  );
}
