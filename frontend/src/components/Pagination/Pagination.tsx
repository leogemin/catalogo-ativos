import { useTranslation } from 'react-i18next';
import styles from './Pagination.module.scss';

interface PaginationProps {
  page: number;
  maxPage: number;
  onChange: (page: number) => void;
}

function buildPageList(page: number, maxPage: number): number[] {
  if (maxPage <= 7) {
    return Array.from({ length: maxPage }, (_, i) => i + 1);
  }
  const candidates = [1, 2, page - 1, page, page + 1, maxPage - 1, maxPage].filter(
    (p) => p >= 1 && p <= maxPage,
  );
  return [...new Set(candidates)].sort((a, b) => a - b);
}

export function Pagination({ page, maxPage, onChange }: PaginationProps) {
  const { t } = useTranslation();

  if (maxPage <= 1) return null;

  const pages = buildPageList(page, maxPage);
  const previousPages = [0, ...pages];

  return (
    <nav className={styles.pagination} aria-label="pagination">
      <button
        type="button"
        className={styles.pagination__btn}
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
        aria-label={t('pagination.previous')}
      >
        ‹
      </button>
      {pages.map((p, index) => {
        const previous = previousPages[index];
        const showEllipsis = previous !== 0 && p - previous > 1;
        return (
          <span key={p} style={{ display: 'contents' }}>
            {showEllipsis && <span className={styles.pagination__ellipsis}>…</span>}
            <button
              type="button"
              className={`${styles.pagination__btn} ${p === page ? styles['pagination__btn--active'] : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        className={styles.pagination__btn}
        disabled={page >= maxPage}
        onClick={() => onChange(Math.min(maxPage, page + 1))}
        aria-label={t('pagination.next')}
      >
        ›
      </button>
    </nav>
  );
}
