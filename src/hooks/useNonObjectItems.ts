import { useCallback } from 'react';
import { fetchNonObjectItems } from '../services/assetService';
import { useAsyncResource } from './useAsyncResource';

export function useNonObjectItems() {
  const fetcher = useCallback(() => fetchNonObjectItems(), []);
  return useAsyncResource(fetcher);
}
