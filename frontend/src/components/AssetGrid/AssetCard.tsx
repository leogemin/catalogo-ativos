import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Asset } from '../../types/asset';
import { displayValue } from '../../utils/text';
import { Highlight } from '../common/Highlight';
import styles from './AssetCard.module.scss';

interface AssetCardProps {
  asset: Asset;
  query: string;
  onSelect: (asset: Asset) => void;
}

export function AssetCard({ asset, query, onSelect }: AssetCardProps) {
  const { t } = useTranslation();

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(asset);
    }
  };

  return (
    <article
      className={styles['asset-card']}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(asset)}
      onKeyDown={handleKeyDown}
    >
      <span className={styles['asset-card__badge']}>{displayValue(asset.categoria)}</span>
      <h3 className={styles['asset-card__title']}>
        <Highlight text={asset.especie} query={query} />
      </h3>
      <div className={styles['asset-card__meta']}>
        <div className={styles['asset-card__meta-row']}>
          <div className={styles['asset-card__meta-key']}>{t('card.supplements')}</div>
          <div className={styles['asset-card__meta-value']}>
            <Highlight text={displayValue(asset.suplementos)} query={query} />
          </div>
        </div>
        <div className={styles['asset-card__meta-row']}>
          <div className={styles['asset-card__meta-key']}>{t('card.fixation')}</div>
          <div
            className={`${styles['asset-card__meta-value']} ${styles['asset-card__meta-value--plate']}`}
          >
            <Highlight text={displayValue(asset.fijacion)} query={query} />
          </div>
        </div>
      </div>
    </article>
  );
}
