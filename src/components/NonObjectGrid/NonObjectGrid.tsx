import styles from './NonObjectGrid.module.scss';

interface NonObjectGridProps {
  items: string[];
}

export function NonObjectGrid({ items }: NonObjectGridProps) {
  return (
    <div className={styles['non-object-grid']}>
      {items.map((item, index) => (
        <div className={styles['non-object-grid__item']} key={`${item}-${index}`}>
          {item}
        </div>
      ))}
    </div>
  );
}
