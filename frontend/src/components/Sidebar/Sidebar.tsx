import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.jpg';
import type { Catalog } from '../../types/asset';
import type { AuthUser } from '../../types/auth';
import { CatalogSelector } from '../common/CatalogSelector';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { UserMenu } from '../UserMenu/UserMenu';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  catalogs: Catalog[];
  selectedCatalogId: string | null;
  onCatalogChange: (catalogId: string) => void;
  user: AuthUser | null;
  onManageUsers: () => void;
  onLogout: () => void;
}

/** Navegação lateral: fixa no desktop; no mobile, barra superior + drawer. */
export function Sidebar({
  catalogs,
  selectedCatalogId,
  onCatalogChange,
  user,
  onManageUsers,
  onLogout,
}: SidebarProps) {
  const { t } = useTranslation();
  const panelId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className={styles['mobile-bar']}>
        <img className={styles['mobile-bar__logo']} src={logo} alt="Ciclo Consultoría" />
        <button
          type="button"
          className={styles['mobile-bar__toggle']}
          onClick={() => setOpen(true)}
          aria-label={t('sidebar.open')}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <span aria-hidden="true">☰</span>
        </button>
      </header>

      {open && <div className={styles.backdrop} onClick={close} aria-hidden="true" />}

      <aside
        id={panelId}
        className={`${styles.sidebar} ${open ? styles['sidebar--open'] : ''}`}
        aria-label={t('app.title')}
      >
        <div className={styles.sidebar__brand}>
          <img className={styles.sidebar__logo} src={logo} alt="Ciclo Consultoría" />
          <button type="button" className={styles.sidebar__close} onClick={close} aria-label={t('sidebar.close')}>
            ×
          </button>
        </div>

        <div className={styles.sidebar__section}>
          <CatalogSelector catalogs={catalogs} selectedId={selectedCatalogId} onChange={onCatalogChange} />
          <LanguageSwitcher />
        </div>

        {user?.isAdmin && (
          <nav className={styles.sidebar__section} aria-label={t('sidebar.manage')}>
            <h2 className={styles.sidebar__heading}>{t('sidebar.manage')}</h2>
            <button
              type="button"
              className={styles.sidebar__action}
              onClick={() => {
                close();
                onManageUsers();
              }}
            >
              {t('users.manage')}
            </button>
          </nav>
        )}

        {user && (
          <div className={styles.sidebar__footer}>
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        )}
      </aside>
    </>
  );
}
