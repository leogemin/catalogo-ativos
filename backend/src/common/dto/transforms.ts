import { Transform } from 'class-transformer';

/** Remove espaços das pontas de strings; outros tipos passam intactos. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

/**
 * Converte "true"/"false" vindos de query string ou multipart em boolean.
 * Lê o valor original (obj[key]) porque a conversão implícita faria
 * Boolean("false") === true.
 */
export const ToBoolean = () =>
  Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = obj[key];
    if (typeof raw !== 'string') return raw;
    const normalized = raw.trim().toLowerCase();
    if (['true', '1', 'yes', 'sim', 'si'].includes(normalized)) return true;
    if (['false', '0', 'no', 'nao', 'não', ''].includes(normalized)) return false;
    return raw;
  });
