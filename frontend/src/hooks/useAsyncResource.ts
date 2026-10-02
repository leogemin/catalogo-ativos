import { useCallback, useEffect, useState } from 'react';
import { isAbortError } from '../services/apiClient';

export interface AsyncResource<T> {
  /** Último resultado bem-sucedido; continua disponível enquanto uma nova busca roda. */
  data: T | null;
  /** Há uma busca em andamento para a chave atual. */
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

interface Settled<T> {
  key: string | null;
  data: T | null;
  error: Error | null;
}

/**
 * Busca assíncrona identificada por `key`: quando a chave muda, a busca
 * anterior é cancelada (AbortController) e uma nova é disparada. Passe
 * `key = null` para desabilitar. `key` deve refletir tudo de que o
 * `fetcher` depende.
 */
export function useAsyncResource<T>(key: string | null, fetcher: (signal: AbortSignal) => Promise<T>): AsyncResource<T> {
  const [reloadCount, setReloadCount] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({ key: null, data: null, error: null });
  const requestKey = key === null ? null : `${key}#${reloadCount}`;

  useEffect(() => {
    if (requestKey === null) return;
    const controller = new AbortController();

    fetcher(controller.signal).then(
      (data) => setSettled({ key: requestKey, data, error: null }),
      (error: unknown) => {
        if (isAbortError(error)) return;
        setSettled((previous) => ({
          key: requestKey,
          data: previous.data,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      },
    );

    return () => controller.abort();
    // `fetcher` é recriado a cada render; `requestKey` já identifica a busca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    data: settled.data,
    loading: requestKey !== null && settled.key !== requestKey,
    error: settled.key === requestKey ? settled.error : null,
    reload,
  };
}
