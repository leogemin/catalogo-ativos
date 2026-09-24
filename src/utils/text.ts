/** Remove acentos e normaliza para maiúsculas, para buscas/comparações tolerantes. */
export function normalize(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

/** Ordena strings alfabeticamente respeitando acentuação em espanhol. */
export function sortAlphabetically(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, 'es'));
}

export function uniqueSorted(values: string[]): string[] {
  return sortAlphabetically([...new Set(values)]);
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/**
 * Divide um texto em segmentos marcando os trechos que casam com `query`
 * (case/acento-insensível), para renderização segura com <mark> em React
 * (sem dangerouslySetInnerHTML).
 */
export function splitHighlight(text: string, query: string): HighlightSegment[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [{ text, match: false }];

  const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let regex: RegExp;
  try {
    regex = new RegExp(`(${escaped})`, 'gi');
  } catch {
    return [{ text, match: false }];
  }

  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), match: false });
    }
    segments.push({ text: match[0], match: true });
    lastIndex = match.index + match[0].length;
    if (match[0].length === 0) regex.lastIndex += 1;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), match: false });
  }

  return segments.length ? segments : [{ text, match: false }];
}
