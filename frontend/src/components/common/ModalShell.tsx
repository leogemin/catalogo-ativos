import type { MouseEvent, ReactNode } from 'react';
import { useEffect } from 'react';
import styles from './ModalShell.module.scss';

interface ModalShellProps {
  onClose: () => void;
  labelledBy: string;
  closeLabel: string;
  header: ReactNode;
  children: ReactNode;
}

/** "Chrome" (overlay + caixa + header com fechar) reutilizado pelos modais do catálogo. */
export function ModalShell({ onClose, labelledBy, closeLabel, header, children }: ModalShellProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className={styles['modal-shell']} onClick={handleBackdropClick}>
      <div className={styles['modal-shell__box']} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <div className={styles['modal-shell__head']}>
          {header}
          <button type="button" className={styles['modal-shell__close']} onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </div>
        <div className={styles['modal-shell__body']}>{children}</div>
      </div>
    </div>
  );
}
