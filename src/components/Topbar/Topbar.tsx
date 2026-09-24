import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.jpg';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import styles from './Topbar.module.scss';

export function Topbar() {
  const { t } = useTranslation();

  return (
    <header className={styles.topbar}>
      <div className={styles.topbar__brand}>
        <img className={styles.topbar__logo} src={logo} alt="Ciclo Consultoría" />
        <div className={styles.topbar__brandline} />
        <div>
          <h1 className={styles.topbar__title}>{t('app.title')}</h1>
          <p className={styles.topbar__subtitle}>{t('app.subtitle')}</p>
        </div>
      </div>
      <div className={styles.topbar__right}>
        <LanguageSwitcher />
        <div className={styles.topbar__badge}>{t('app.badge')}</div>
      </div>
    </header>
  );
}
