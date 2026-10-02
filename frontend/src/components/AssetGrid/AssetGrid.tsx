import type { Asset } from '../../types/asset';
import { AssetCard } from './AssetCard';
import styles from './AssetGrid.module.scss';

interface AssetGridProps {
  assets: Asset[];
  query: string;
  onSelect: (asset: Asset) => void;
}

export function AssetGrid({ assets, query, onSelect }: AssetGridProps) {
  return (
    <div className={styles['asset-grid']}>
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} query={query} onSelect={onSelect} />
      ))}
    </div>
  );
}
