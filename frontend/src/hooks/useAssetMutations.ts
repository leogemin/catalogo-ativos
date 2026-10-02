import { useCallback, useState } from 'react';
import { createCatalogItem, updateCatalogItem } from '../services/catalogService';
import type { Asset, AssetInput } from '../types/asset';

interface UseAssetMutationsResult {
  createAsset: (catalogId: string, input: AssetInput) => Promise<Asset>;
  updateAsset: (catalogId: string, itemId: string, input: AssetInput) => Promise<Asset>;
  submitting: boolean;
  error: Error | null;
  resetError: () => void;
}

/** Escritas de itens (criar/editar) na API, expondo `submitting`/`error` para a UI. */
export function useAssetMutations(): UseAssetMutationsResult {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const runMutation = useCallback(async <T>(task: () => Promise<T>): Promise<T> => {
    setSubmitting(true);
    setError(null);
    try {
      return await task();
    } catch (caught) {
      const normalized = caught instanceof Error ? caught : new Error(String(caught));
      setError(normalized);
      throw normalized;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const create = useCallback(
    (catalogId: string, input: AssetInput) => runMutation(() => createCatalogItem(catalogId, input)),
    [runMutation],
  );

  const update = useCallback(
    (catalogId: string, itemId: string, input: AssetInput) =>
      runMutation(() => updateCatalogItem(catalogId, itemId, input)),
    [runMutation],
  );

  const resetError = useCallback(() => setError(null), []);

  return { createAsset: create, updateAsset: update, submitting, error, resetError };
}
