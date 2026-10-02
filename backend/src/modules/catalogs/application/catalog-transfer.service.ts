import { Injectable } from '@nestjs/common';
import { BusinessRuleError } from '../../../common/errors/domain.errors.js';
import { slugify } from '../../../common/utils/text.js';
import type { NewCatalogItem } from '../domain/catalog-item.entity.js';
import { CatalogItemRepository, type ImportMode } from '../domain/catalog-item.repository.js';
import type { CatalogItemType } from '../domain/catalog-item-type.enum.js';
import type { NewCatalog } from '../domain/catalog.entity.js';
import { CatalogRepository } from '../domain/catalog.repository.js';
import { CatalogCsvService, type CsvDelimiter, type ParsedCatalogCsv } from './catalog-csv.service.js';
import { CatalogsService, type CatalogWithCounts } from './catalogs.service.js';

export interface ImportRowError {
  line: number;
  errors: string[];
}

export interface ImportReport {
  mode: ImportMode;
  totalRows: number;
  imported: number;
  skipped: number;
  /** Limitado às primeiras `MAX_REPORTED_ERRORS` linhas com erro. */
  errors: ImportRowError[];
}

export interface ImportOptions {
  /** `false` (padrão): qualquer linha inválida aborta a importação inteira. */
  skipInvalid?: boolean;
}

export interface ExportOptions {
  type?: CatalogItemType;
  delimiter?: CsvDelimiter;
}

export interface CsvExport {
  filename: string;
  content: string;
}

const MAX_REPORTED_ERRORS = 100;

@Injectable()
export class CatalogTransferService {
  constructor(
    private readonly catalogsService: CatalogsService,
    private readonly catalogs: CatalogRepository,
    private readonly items: CatalogItemRepository,
    private readonly csv: CatalogCsvService,
  ) {}

  async importAsNewCatalog(
    file: Buffer,
    data: NewCatalog,
    options: ImportOptions = {},
  ): Promise<{ catalog: CatalogWithCounts; report: ImportReport }> {
    await this.catalogsService.assertNameAvailable(data.name);
    const { valid, report } = this.collect(this.csv.parse(file), 'append', options);

    const catalog = await this.catalogs.createWithItems(data, valid);
    return { catalog: await this.catalogsService.get(catalog.id), report };
  }

  async importIntoCatalog(
    catalogId: string,
    file: Buffer,
    mode: ImportMode,
    options: ImportOptions = {},
  ): Promise<ImportReport> {
    await this.catalogsService.findEntityOrFail(catalogId);
    const { valid, report } = this.collect(this.csv.parse(file), mode, options);

    await this.items.bulkImport(catalogId, valid, mode);
    return report;
  }

  async exportCatalog(catalogId: string, options: ExportOptions = {}): Promise<CsvExport> {
    const catalog = await this.catalogsService.findEntityOrFail(catalogId);
    const items = await this.items.findAll(catalogId, options.type);
    return {
      filename: `${slugify(catalog.name, 'catalogo')}.csv`,
      content: this.csv.serialize(items, options.delimiter),
    };
  }

  private collect(
    parsed: ParsedCatalogCsv,
    mode: ImportMode,
    { skipInvalid = false }: ImportOptions,
  ): { valid: NewCatalogItem[]; report: ImportReport } {
    const valid: NewCatalogItem[] = [];
    const invalid: ImportRowError[] = [];
    for (const row of parsed.rows) {
      if ('item' in row) valid.push(row.item);
      else invalid.push({ line: row.line, errors: row.errors });
    }

    const reportedErrors = invalid.slice(0, MAX_REPORTED_ERRORS);
    if (invalid.length > 0 && !skipInvalid) {
      throw new BusinessRuleError(
        `${invalid.length} linha(s) inválida(s); nada foi importado. Corrija o arquivo ou use skipInvalid=true.`,
        { invalidRows: invalid.length, errors: reportedErrors },
      );
    }
    if (valid.length === 0) {
      throw new BusinessRuleError('Nenhuma linha válida para importar.', { errors: reportedErrors });
    }

    return {
      valid,
      report: {
        mode,
        totalRows: parsed.rows.length,
        imported: valid.length,
        skipped: invalid.length,
        errors: reportedErrors,
      },
    };
  }
}
