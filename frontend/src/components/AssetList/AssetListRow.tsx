import type { Asset } from '../../types/asset';
import { displayValue } from '../../utils/text';
import styles from './AssetList.module.scss';

interface AssetListRowProps {
  asset: Asset;
  onSelect: (asset: Asset) => void;
}

export function AssetListRow({ asset, onSelect }: AssetListRowProps) {
  return (
    <button
      type="button"
      className={`${styles['asset-list__row']} ${styles['asset-list__row--body']}`}
      onClick={() => onSelect(asset)}
    >
      <span className={styles['asset-list__name']}>{asset.especie}</span>
      <span>{displayValue(asset.categoria)}</span>
      <span>{displayValue(asset.suplementos)}</span>
      <span>{displayValue(asset.fijacion)}</span>
    </button>
  );
}
