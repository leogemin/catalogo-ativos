import { useTranslation } from 'react-i18next';
import type { Asset } from '../../types/asset';
import { AssetListRow } from './AssetListRow';
import styles from './AssetList.module.scss';

interface AssetListProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
}

export function AssetList({ assets, onSelect }: AssetListProps) {
  const { t } = useTranslation();

  return (
    <div className={styles['asset-list']}>
      <div className={`${styles['asset-list__row']} ${styles['asset-list__row--head']}`}>
        <div>{t('list.headerSpecies')}</div>
        <div>{t('list.headerCategory')}</div>
        <div>{t('list.headerSupplements')}</div>
        <div>{t('list.headerFixation')}</div>
      </div>
      {assets.map((asset) => (
        <AssetListRow key={asset.id} asset={asset} onSelect={onSelect} />
      ))}
    </div>
  );
}
