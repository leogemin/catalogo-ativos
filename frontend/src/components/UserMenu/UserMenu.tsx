import { useTranslation } from 'react-i18next';
import type { AuthUser } from '../../types/auth';
import styles from './UserMenu.module.scss';

interface UserMenuProps {
  user: AuthUser;
  onManageUsers: () => void;
  onLogout: () => void;
}

export function UserMenu({ user, onManageUsers, onLogout }: UserMenuProps) {
  const { t } = useTranslation();

  return (
    <div className={styles['user-menu']}>
      <div className={styles['user-menu__identity']} title={user.username}>
        <span className={styles['user-menu__avatar']} aria-hidden="true">
          {user.username.charAt(0).toUpperCase()}
        </span>
        <span className={styles['user-menu__name']}>{user.username}</span>
      </div>
      {user.isAdmin && (
        <button type="button" className={styles['user-menu__btn']} onClick={onManageUsers}>
          {t('users.manage')}
        </button>
      )}
      <button type="button" className={styles['user-menu__btn']} onClick={onLogout}>
        {t('auth.logout')}
      </button>
    </div>
  );
}
