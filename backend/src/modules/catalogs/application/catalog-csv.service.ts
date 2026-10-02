import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { InvalidInputError } from '../../../common/errors/domain.errors.js';
import { toLookupKey } from '../../../common/utils/text.js';
import type { NewCatalogItem } from '../domain/catalog-item.entity.js';
import { type CatalogItemDraft, validateCatalogItem } from '../domain/catalog-item.rules.js';
import { CatalogItemType } from '../domain/catalog-item-type.enum.js';

export type CsvDelimiter = ',' | ';';

type CsvField = 'type' | 'categoria' | 'especie' | 'suplementos' | 'fijacion';

export const CSV_COLUMNS: readonly string[] = ['tipo', 'categoria', 'especie', 'suplementos', 'fijacion'];
export const CSV_MAX_ROWS = 20_000;

// Cabeçalhos aceitos (comparados sem acento/caixa/pontuação), em es, pt e en.
const HEADER_ALIASES: Record<CsvField, string[]> = {
  type: ['tipo', 'type'],
  categoria: ['categoria', 'category'],
  especie: ['especie', 'species', 'nombre', 'nome', 'name'],
  suplementos: ['suplementos', 'suplemento', 'supplements', 'datosacapturar', 'dadosacapturar'],
  fijacion: [
    'fijacion',
    'fijaciondelaplaca',
    'fijaciondeplaca',
    'fixacao',
    'fixacaodaplaca',
    'fixacaodeplaca',
    'fixation',
    'placa',
  ],
};

const TYPE_ALIASES: Record<string, CatalogItemType> = {
  asset: CatalogItemType.ASSET,
  activo: CatalogItemType.ASSET,
  ativo: CatalogItemType.ASSET,
  nonobject: CatalogItemType.NON_OBJECT,
  noobjeto: CatalogItemType.NON_OBJECT,
  biennoobjeto: CatalogItemType.NON_OBJECT,
  naoobjeto: CatalogItemType.NON_OBJECT,
  bemnaoobjeto: CatalogItemType.NON_OBJECT,
};

export type ParsedCsvRow = { line: number; item: NewCatalogItem } | { line: number; errors: string[] };

export interface ParsedCatalogCsv {
  delimiter: CsvDelimiter;
  rows: ParsedCsvRow[];
}

@Injectable()
export class CatalogCsvService {
  /**
   * Lê um CSV de catálogo. Erros no arquivo como um todo (vazio, malformado,
   * sem coluna "especie") lançam `InvalidInputError`; erros de linha voltam
   * em `rows` para quem chamou decidir se aborta ou pula a linha.
   */
  parse(content: Buffer | string): ParsedCatalogCsv {
    const text = (typeof content === 'string' ? content : content.toString('utf8')).replace(/^﻿/, '');
    if (!text.trim()) throw new InvalidInputError('O arquivo CSV está vazio.');

    const delimiter = this.detectDelimiter(text);
    let records: Array<{ record: string[]; info: { lines: number } }>;
    try {
      // Com `info: true` cada registro vem como { record, info }, o que a
      // tipagem do csv-parse não reflete.
      records = parse(text, {
        delimiter,
        info: true,
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as unknown as Array<{ record: string[]; info: { lines: number } }>;
    } catch (error) {
      throw new InvalidInputError(`CSV malformado: ${(error as Error).message}`);
    }

    const [header, ...body] = records;
    const columns = this.mapHeader(header.record);
    if (body.length === 0) throw new InvalidInputError('O arquivo CSV não tem linhas de dados.');
    if (body.length > CSV_MAX_ROWS) {
      throw new InvalidInputError(`O arquivo excede o limite de ${CSV_MAX_ROWS} linhas.`, { rows: body.length });
    }

    const rows = body.map(({ record, info }): ParsedCsvRow => {
      const value = (field: CsvField) => {
        const index = columns.get(field);
        return index === undefined ? undefined : record[index];
      };

      const rawType = value('type')?.trim() ?? '';
      const type = rawType ? TYPE_ALIASES[toLookupKey(rawType)] : undefined;
      if (rawType && !type) {
        return { line: info.lines, errors: [`tipo inválido: "${rawType}" (use ASSET ou NON_OBJECT)`] };
      }

      const draft: CatalogItemDraft = {
        type,
        especie: value('especie'),
        categoria: value('categoria'),
        suplementos: value('suplementos'),
        fijacion: value('fijacion'),
      };
      const result = validateCatalogItem(draft);
      return result.ok ? { line: info.lines, item: result.item } : { line: info.lines, errors: result.errors };
    });

    return { delimiter, rows };
  }

  /** Gera o CSV no mesmo formato aceito por `parse`, com BOM para o Excel abrir em UTF-8. */
  serialize(items: NewCatalogItem[], delimiter: CsvDelimiter = ','): string {
    const records = items.map((item) => [
      item.type,
      item.categoria ?? '',
      item.especie,
      item.suplementos ?? '',
      item.fijacion ?? '',
    ]);
    const body = stringify([CSV_COLUMNS as string[], ...records], { delimiter, record_delimiter: 'windows' });
    return `﻿${body}`;
  }

  // Excel em pt/es costuma salvar CSV com ";"; decide pelo cabeçalho.
  private detectDelimiter(text: string): CsvDelimiter {
    const firstLine = text.slice(0, text.search(/\r?\n|$/));
    const count = (char: string) => firstLine.split(char).length - 1;
    return count(';') > count(',') ? ';' : ',';
  }

  private mapHeader(header: string[]): Map<CsvField, number> {
    const columns = new Map<CsvField, number>();
    header.forEach((name, index) => {
      const key = toLookupKey(name);
      const field = (Object.keys(HEADER_ALIASES) as CsvField[]).find((candidate) =>
        HEADER_ALIASES[candidate].includes(key),
      );
      if (!field) return;
      if (columns.has(field)) throw new InvalidInputError(`Coluna duplicada no cabeçalho: "${name}".`);
      columns.set(field, index);
    });

    if (!columns.has('especie')) {
      throw new InvalidInputError('Cabeçalho sem a coluna obrigatória "especie".', {
        expectedColumns: CSV_COLUMNS,
        receivedColumns: header,
      });
    }
    return columns;
  }
}
