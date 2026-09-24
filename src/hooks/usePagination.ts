import { useEffect, useMemo, useState } from 'react';

export interface PaginationResult<T> {
  page: number;
  maxPage: number;
  pageItems: T[];
  goToPage: (page: number) => void;
}

/**
 * Pagina uma lista já filtrada. A página volta para 1 sempre que o total
 * de itens muda (ou seja, sempre que um filtro é alterado), replicando o
 * comportamento do protótipo original.
 */
export function usePagination<T>(items: T[], pageSize: number, resetKey?: unknown): PaginationResult<T> {
  const [page, setPage] = useState(1);

  const maxPage = Math.max(1, Math.ceil(items.length / pageSize));

  // Volta para a página 1 sempre que os filtros mudam (resetKey), não só
  // quando a quantidade de resultados muda — isso evita ficar "preso" numa
  // página com resultados diferentes dos que o usuário acabou de filtrar.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, pageSize]);

  const safePage = Math.min(page, maxPage);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    maxPage,
    pageItems,
    goToPage: setPage,
  };
}
