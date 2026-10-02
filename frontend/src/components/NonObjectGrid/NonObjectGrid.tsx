import type { Asset } from '../../types/asset';
import styles from './NonObjectGrid.module.scss';

interface NonObjectGridProps {
  items: Asset[];
}

export function NonObjectGrid({ items }: NonObjectGridProps) {
  return (
    <div className={styles['non-object-grid']}>
      {items.map((item) => (
        <div className={styles['non-object-grid__item']} key={item.id}>
          {item.especie}
        </div>
      ))}
    </div>
  );
}
