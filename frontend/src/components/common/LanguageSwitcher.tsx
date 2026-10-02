import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';
import styles from './LanguageSwitcher.module.scss';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    void i18n.changeLanguage(event.target.value as SupportedLanguage);
  };

  return (
    <div className={styles['language-switcher']}>
      <label className={styles['language-switcher__label']} htmlFor="language-select">
        {t('language.label')}
      </label>
      <select
        id="language-select"
        className={styles['language-switcher__select']}
        value={i18n.resolvedLanguage ?? i18n.language}
        onChange={handleChange}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {t(`language.${lang}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
