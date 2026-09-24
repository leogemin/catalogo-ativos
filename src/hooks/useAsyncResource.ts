import { useEffect, useState } from 'react';

export interface AsyncResourceState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook genérico para consumir a camada de serviços (`src/services`).
 * Abstrai o ciclo loading/error/data para que trocar um mock por uma
 * chamada HTTP real não exija mudanças nos componentes que consomem o hook.
 */
export function useAsyncResource<T>(fetcher: () => Promise<T>): AsyncResourceState<T> {
  const [state, setState] = useState<AsyncResourceState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher]);

  return state;
}
