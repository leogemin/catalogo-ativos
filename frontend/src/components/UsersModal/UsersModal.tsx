import { useCallback, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { ApiError } from '../../services/apiClient';
import { createUser, deleteUser, fetchUsers } from '../../services/authService';
import type { User } from '../../types/auth';
import { ModalShell } from '../common/ModalShell';
import styles from './UsersModal.module.scss';

interface UsersModalProps {
  onClose: () => void;
}

interface FormValues {
  username: string;
  password: string;
  confirmPassword: string;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_VALUES: FormValues = { username: '', password: '', confirmPassword: '' };
// Mesmas regras do backend (CreateUserDto).
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,50}$/;
const PASSWORD_MIN_LENGTH = 8;

/** Gestão de usuários: só é aberto pelo admin (a API também recusa os demais). */
export function UsersModal({ onClose }: UsersModalProps) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const users = useAsyncResource<User[]>('users', useCallback((signal: AbortSignal) => fetchUsers(signal), []));

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const updateField = (field: keyof FormValues) => (event: { target: { value: string } }) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = values.username.trim();

    const errors: FieldErrors = {};
    if (!USERNAME_PATTERN.test(username)) errors.username = t('users.usernameRule');
    if (values.password.length < PASSWORD_MIN_LENGTH) errors.password = t('users.passwordRule');
    if (values.confirmPassword !== values.password) errors.confirmPassword = t('users.passwordMismatch');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const created = await createUser({ username, password: values.password });
      setValues(EMPTY_VALUES);
      setFeedback({ tone: 'success', message: t('users.created', { username: created.username }) });
      users.reload();
    } catch (caught) {
      const message =
        caught instanceof ApiError && caught.status === 409 ? t('users.duplicate') : t('users.genericError');
      setFeedback({ tone: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(t('users.confirmDelete', { username: user.username }))) return;
    setDeletingId(user.id);
    setFeedback(null);
    try {
      await deleteUser(user.id);
      users.reload();
    } catch {
      setFeedback({ tone: 'error', message: t('users.genericError') });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(i18n.resolvedLanguage ?? 'es');

  return (
    <ModalShell
      onClose={onClose}
      labelledBy={titleId}
      closeLabel={t('modal.close')}
      header={
        <div>
          <div className={styles['users-modal__eyebrow']}>{t('users.eyebrow')}</div>
          <h3 id={titleId} className={styles['users-modal__title']}>
            {t('users.title')}
          </h3>
        </div>
      }
    >
      <form className={styles['users-modal__form']} onSubmit={handleSubmit} noValidate>
        <div className={styles['users-modal__section-title']}>{t('users.newUser')}</div>
        <div className={styles['users-modal__row']}>
          <div className={styles['users-modal__field']}>
            <label htmlFor="user-username">{t('auth.username')}</label>
            <input
              id="user-username"
              value={values.username}
              onChange={updateField('username')}
              placeholder={t('users.usernamePlaceholder')}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.username)}
            />
            {fieldErrors.username && <span className={styles['users-modal__error']}>{fieldErrors.username}</span>}
          </div>
          <div className={styles['users-modal__field']}>
            <label htmlFor="user-password">{t('auth.password')}</label>
            <input
              id="user-password"
              type="password"
              value={values.password}
              onChange={updateField('password')}
              autoComplete="new-password"
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password && <span className={styles['users-modal__error']}>{fieldErrors.password}</span>}
          </div>
          <div className={styles['users-modal__field']}>
            <label htmlFor="user-confirm-password">{t('users.confirmPassword')}</label>
            <input
              id="user-confirm-password"
              type="password"
              value={values.confirmPassword}
              onChange={updateField('confirmPassword')}
              autoComplete="new-password"
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
            />
            {fieldErrors.confirmPassword && (
              <span className={styles['users-modal__error']}>{fieldErrors.confirmPassword}</span>
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`${styles['users-modal__feedback']} ${styles[`users-modal__feedback--${feedback.tone}`]}`}
            role={feedback.tone === 'error' ? 'alert' : 'status'}
          >
            {feedback.message}
          </div>
        )}

        <div className={styles['users-modal__actions']}>
          <button type="submit" className={styles['users-modal__submit']} disabled={submitting}>
            {submitting ? t('form.submitting') : t('users.submit')}
          </button>
        </div>
      </form>

      <div className={styles['users-modal__section-title']}>{t('users.listTitle')}</div>
      {!users.data ? (
        <div className={styles['users-modal__empty']}>{users.error ? t('users.loadError') : t('users.loading')}</div>
      ) : (
        <ul className={styles['users-modal__list']} aria-busy={users.loading}>
          {users.data.map((user) => (
            <li key={user.id} className={styles['users-modal__item']}>
              <span className={styles['users-modal__avatar']} aria-hidden="true">
                {user.username.charAt(0).toUpperCase()}
              </span>
              <div className={styles['users-modal__item-main']}>
                <span className={styles['users-modal__username']}>{user.username}</span>
                <span className={styles['users-modal__meta']}>
                  {t('users.createdAt', { date: formatDate(user.createdAt) })}
                </span>
              </div>
              {user.isAdmin ? (
                <span className={styles['users-modal__badge']}>{t('users.adminBadge')}</span>
              ) : (
                <button
                  type="button"
                  className={styles['users-modal__delete']}
                  onClick={() => void handleDelete(user)}
                  disabled={deletingId === user.id}
                >
                  {t('users.delete')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}
