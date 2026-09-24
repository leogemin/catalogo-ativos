import { useId, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Asset, AssetFormMode, AssetInput } from '../../types/asset';
import { ModalShell } from '../common/ModalShell';
import styles from './AssetFormModal.module.scss';

interface AssetFormModalProps {
  mode: AssetFormMode;
  initialValue: Asset | null;
  categories: string[];
  fixations: string[];
  submitting: boolean;
  submitError: string | null;
  onSubmit: (input: AssetInput) => void | Promise<void>;
  onClose: () => void;
}

interface FieldErrors {
  especie?: string;
  categoria?: string;
  fijacion?: string;
}

const EMPTY_VALUES: AssetInput = { especie: '', categoria: '', suplementos: '', fijacion: '' };

export function AssetFormModal({
  mode,
  initialValue,
  categories,
  fixations,
  submitting,
  submitError,
  onSubmit,
  onClose,
}: AssetFormModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const categoryListId = useId();
  const fixationListId = useId();

  const [values, setValues] = useState<AssetInput>(
    initialValue
      ? {
          especie: initialValue.especie,
          categoria: initialValue.categoria,
          suplementos: initialValue.suplementos,
          fijacion: initialValue.fijacion,
        }
      : EMPTY_VALUES,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const updateField =
    (field: keyof AssetInput) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const especie = values.especie.trim();
    const categoria = values.categoria.trim();
    const fijacion = values.fijacion.trim();
    const suplementos = values.suplementos.trim();

    const errors: FieldErrors = {};
    if (!especie) errors.especie = t('form.requiredField');
    if (!categoria) errors.categoria = t('form.requiredField');
    if (!fijacion) errors.fijacion = t('form.requiredField');

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    await onSubmit({ especie, categoria, fijacion, suplementos: suplementos || '—' });
  };

  return (
    <ModalShell
      onClose={onClose}
      labelledBy={titleId}
      closeLabel={t('modal.close')}
      header={
        <h3 id={titleId} className={styles['asset-form__title']}>
          {mode === 'create' ? t('form.addTitle') : t('form.editTitle')}
        </h3>
      }
    >
      <form className={styles['asset-form']} onSubmit={handleSubmit} noValidate>
        <div className={styles['asset-form__field']}>
          <label htmlFor="asset-especie">{t('form.fieldSpecies')}</label>
          <input
            id="asset-especie"
            value={values.especie}
            onChange={updateField('especie')}
            placeholder={t('form.fieldSpeciesPlaceholder')}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.especie)}
          />
          {fieldErrors.especie && <span className={styles['asset-form__error']}>{fieldErrors.especie}</span>}
        </div>

        <div className={styles['asset-form__row']}>
          <div className={styles['asset-form__field']}>
            <label htmlFor="asset-categoria">{t('form.fieldCategory')}</label>
            <input
              id="asset-categoria"
              list={categoryListId}
              value={values.categoria}
              onChange={updateField('categoria')}
              placeholder={t('form.fieldCategoryPlaceholder')}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.categoria)}
              autoComplete="off"
            />
            <datalist id={categoryListId}>
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {fieldErrors.categoria && (
              <span className={styles['asset-form__error']}>{fieldErrors.categoria}</span>
            )}
          </div>

          <div className={styles['asset-form__field']}>
            <label htmlFor="asset-fijacion">{t('form.fieldFixation')}</label>
            <input
              id="asset-fijacion"
              list={fixationListId}
              value={values.fijacion}
              onChange={updateField('fijacion')}
              placeholder={t('form.fieldFixationPlaceholder')}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.fijacion)}
              autoComplete="off"
            />
            <datalist id={fixationListId}>
              {fixations.map((fixation) => (
                <option key={fixation} value={fixation} />
              ))}
            </datalist>
            {fieldErrors.fijacion && (
              <span className={styles['asset-form__error']}>{fieldErrors.fijacion}</span>
            )}
          </div>
        </div>

        <div className={styles['asset-form__field']}>
          <label htmlFor="asset-suplementos">{t('form.fieldSupplements')}</label>
          <textarea
            id="asset-suplementos"
            value={values.suplementos}
            onChange={updateField('suplementos')}
            placeholder={t('form.fieldSupplementsPlaceholder')}
            disabled={submitting}
            rows={3}
          />
          <span className={styles['asset-form__hint']}>{t('form.fieldSupplementsHint')}</span>
        </div>

        {submitError && <div className={styles['asset-form__submit-error']}>{submitError}</div>}

        <p className={styles['asset-form__notice']}>{t('form.persistenceNotice')}</p>

        <div className={styles['asset-form__actions']}>
          <button
            type="button"
            className={styles['asset-form__cancel']}
            onClick={onClose}
            disabled={submitting}
          >
            {t('form.cancel')}
          </button>
          <button type="submit" className={styles['asset-form__submit']} disabled={submitting}>
            {submitting ? t('form.submitting') : mode === 'create' ? t('form.submitCreate') : t('form.submitEdit')}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
