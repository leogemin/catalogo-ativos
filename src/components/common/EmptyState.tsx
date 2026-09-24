import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return <div className={styles['empty-state']}>{message}</div>;
}
