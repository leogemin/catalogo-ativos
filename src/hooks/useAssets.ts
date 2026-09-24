import { useCallback } from 'react';
import { fetchAssets } from '../services/assetService';
import { useAsyncResource } from './useAsyncResource';

export function useAssets() {
  const fetcher = useCallback(() => fetchAssets(), []);
  return useAsyncResource(fetcher);
}
