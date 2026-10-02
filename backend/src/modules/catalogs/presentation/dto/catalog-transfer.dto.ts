import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsIn, IsOptional } from 'class-validator';
import { ToBoolean } from '../../../../common/dto/transforms.js';
import type { ImportMode } from '../../domain/catalog-item.repository.js';
import { CatalogItemType } from '../../domain/catalog-item-type.enum.js';
import { CatalogResponseDto, CreateCatalogDto } from './catalog.dto.js';

const IMPORT_MODES: ImportMode[] = ['append', 'replace'];
const DELIMITERS = ['comma', 'semicolon'] as const;
export type DelimiterOption = (typeof DELIMITERS)[number];

/** Campos de texto do multipart em POST /catalogs/import (o arquivo vai em `file`). */
export class ImportNewCatalogDto extends CreateCatalogDto {
  @ApiPropertyOptional({ default: false, description: 'Pula linhas inválidas em vez de abortar a importação.' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  skipInvalid?: boolean;
}

export class ImportIntoCatalogQueryDto {
  @ApiPropertyOptional({
    enum: IMPORT_MODES,
    default: 'append',
    description: '`append` adiciona aos itens atuais; `replace` apaga os itens atuais antes (na mesma transação).',
  })
  @IsOptional()
  @IsIn(IMPORT_MODES)
  mode: ImportMode = 'append';

  @ApiPropertyOptional({ default: false, description: 'Pula linhas inválidas em vez de abortar a importação.' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  skipInvalid?: boolean;
}

export class ExportCatalogQueryDto {
  @ApiPropertyOptional({ enum: CatalogItemType, description: 'Exporta só um tipo; omitido = todos.' })
  @IsOptional()
  @IsEnum(CatalogItemType)
  type?: CatalogItemType;

  @ApiPropertyOptional({
    enum: DELIMITERS,
    default: 'comma',
    description: 'Use `semicolon` para abrir direto no Excel em pt/es.',
  })
  @IsOptional()
  @IsIn(DELIMITERS)
  delimiter: DelimiterOption = 'comma';
}

export class ImportRowErrorDto {
  @ApiProperty({ description: 'Linha do arquivo (o cabeçalho é a linha 1).' })
  line: number;

  @ApiProperty({ type: [String] })
  errors: string[];
}

export class ImportReportDto {
  @ApiProperty({ enum: IMPORT_MODES })
  mode: ImportMode;

  @ApiProperty()
  totalRows: number;

  @ApiProperty()
  imported: number;

  @ApiProperty()
  skipped: number;

  @ApiProperty({ type: [ImportRowErrorDto], description: 'Até 100 linhas com erro.' })
  errors: ImportRowErrorDto[];
}

export class CatalogImportResultDto {
  @ApiProperty({ type: CatalogResponseDto })
  catalog: CatalogResponseDto;

  @ApiProperty({ type: ImportReportDto })
  report: ImportReportDto;
}
