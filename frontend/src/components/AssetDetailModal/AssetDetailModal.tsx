import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { Asset } from '../../types/asset';
import { displayValue } from '../../utils/text';
import { ModalShell } from '../common/ModalShell';
import styles from './AssetDetailModal.module.scss';

interface AssetDetailModalProps {
  asset: Asset | null;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
}

export function AssetDetailModal({ asset, onClose, onEdit }: AssetDetailModalProps) {
  const { t } = useTranslation();
  const titleId = useId();

  if (!asset) return null;

  return (
    <ModalShell
      onClose={onClose}
      labelledBy={titleId}
      closeLabel={t('modal.close')}
      header={
        <div>
          <div className={styles['asset-detail__category']}>{displayValue(asset.categoria)}</div>
          <h3 id={titleId} className={styles['asset-detail__name']}>
            {asset.especie}
          </h3>
        </div>
      }
    >
      <div className={styles['asset-detail__details']}>
        <div className={styles.detail}>
          <div className={styles.detail__key}>{t('modal.supplementsTitle')}</div>
          <div className={styles.detail__value}>{displayValue(asset.suplementos)}</div>
        </div>
        <div className={styles.detail}>
          <div className={styles.detail__key}>{t('modal.fixationTitle')}</div>
          <div className={styles.detail__value}>{displayValue(asset.fijacion)}</div>
        </div>
      </div>
      <button type="button" className={styles['asset-detail__edit']} onClick={() => onEdit(asset)}>
        {t('actions.editAsset')}
      </button>
    </ModalShell>
  );
}
