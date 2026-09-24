import { useCallback, useState } from 'react';
import { createAsset, updateAsset } from '../services/assetService';
import type { Asset, AssetInput } from '../types/asset';

interface UseAssetMutationsResult {
  createAsset: (input: AssetInput) => Promise<Asset>;
  updateAsset: (id: string, input: AssetInput) => Promise<Asset>;
  submitting: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Encapsula as escritas do catálogo (criar/editar) chamando a camada de
 * serviço e expondo `submitting`/`error` para a UI. Hoje o serviço é mock
 * (ver `src/services/assetService.ts`); quando o backend existir, só o
 * corpo das funções do serviço muda — este hook e os componentes que o
 * consomem continuam iguais.
 */
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
    (input: AssetInput) => runMutation(() => createAsset(input)),
    [runMutation],
  );

  const update = useCallback(
    (id: string, input: AssetInput) => runMutation(() => updateAsset(id, input)),
    [runMutation],
  );

  const resetError = useCallback(() => setError(null), []);

  return { createAsset: create, updateAsset: update, submitting, error, resetError };
}
