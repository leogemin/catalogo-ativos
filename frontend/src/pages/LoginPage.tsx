import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.jpg';
import { useAuth } from '../auth/useAuth';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { ApiError } from '../services/apiClient';
import styles from './LoginPage.module.scss';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const titleId = useId();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError(t('auth.requiredFields'));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 401 ? t('auth.invalidCredentials') : t('auth.genericError'));
      setPassword('');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.login}>
      <div className={styles.login__language}>
        <LanguageSwitcher />
      </div>

      <div className={styles.login__card}>
        <section className={styles.login__hero}>
          <div className={styles.login__eyebrow}>{t('hero.eyebrow')}</div>
          <h2 className={styles['login__hero-title']}>{t('app.title')}</h2>
          <p className={styles['login__hero-text']}>{t('app.subtitle')}</p>
          <div className={styles.login__badge}>{t('app.badge')}</div>
        </section>

        <section className={styles.login__panel}>
          <img className={styles.login__logo} src={logo} alt="Ciclo Consultoría" />
          <h1 id={titleId} className={styles.login__title}>
            {t('auth.title')}
          </h1>
          <p className={styles.login__subtitle}>{t('auth.subtitle')}</p>

          <form className={styles.login__form} onSubmit={handleSubmit} aria-labelledby={titleId} noValidate>
            <div className={styles.login__field}>
              <label htmlFor="login-username">{t('auth.username')}</label>
              <input
                id="login-username"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                disabled={submitting}
              />
            </div>

            <div className={styles.login__field}>
              <label htmlFor="login-password">{t('auth.password')}</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={submitting}
              />
            </div>

            {error && (
              <div className={styles.login__error} role="alert">
                {error}
              </div>
            )}

            <button type="submit" className={styles.login__submit} disabled={submitting}>
              {submitting ? t('auth.submitting') : t('auth.submit')}
            </button>
          </form>
        </section>
      </div>

      <p className={styles.login__footer}>{t('footer.source')}</p>
    </div>
  );
}
