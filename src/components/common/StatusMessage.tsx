import styles from './EmptyState.module.scss';

interface StatusMessageProps {
  message: string;
  tone?: 'loading' | 'error';
}

export function StatusMessage({ message, tone = 'loading' }: StatusMessageProps) {
  return (
    <div className={styles['empty-state']} role={tone === 'error' ? 'alert' : 'status'}>
      {message}
    </div>
  );
}
