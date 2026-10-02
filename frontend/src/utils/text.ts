/** A API devolve `null` para campos sem valor; na UI eles aparecem como "—", como no catálogo original. */
export function displayValue(value: string | null | undefined): string {
  return value && value.trim() ? value : '—';
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
