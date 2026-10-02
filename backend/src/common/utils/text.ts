/** Remove acentos e tudo que não é letra/dígito, em minúsculas: "Fijación de la placa" → "fijaciondelaplaca". */
export function toLookupKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Gera um nome de arquivo ASCII seguro a partir de um texto livre. */
export function slugify(value: string, fallback = 'arquivo'): string {
  const slug = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallback;
}
