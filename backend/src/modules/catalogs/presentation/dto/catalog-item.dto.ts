import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PageMetaDto, PaginationQueryDto } from '../../../../common/dto/pagination.dto.js';
import { Trim } from '../../../../common/dto/transforms.js';
import { CATALOG_ITEM_LIMITS } from '../../domain/catalog-item.entity.js';
import type { CatalogItemSortField, SortOrder } from '../../domain/catalog-item.repository.js';
import { CatalogItemType } from '../../domain/catalog-item-type.enum.js';

const SORT_FIELDS: CatalogItemSortField[] = ['especie', 'categoria', 'createdAt'];
const SORT_ORDERS: SortOrder[] = ['ASC', 'DESC'];

export class ListCatalogItemsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CatalogItemType })
  @IsOptional()
  @IsEnum(CatalogItemType)
  type?: CatalogItemType;

  @ApiPropertyOptional({ description: 'Busca sem acento/caixa em especie, categoria, suplementos e fijacion.' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ description: 'Categoria exata.' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Critério de fijación exato.' })
  @IsOptional()
  @IsString()
  fijacion?: string;

  @ApiPropertyOptional({ description: 'Letra inicial da especie (A–Z).', example: 'A' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z]$/, { message: 'letter deve ser uma única letra de A a Z' })
  letter?: string;

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: 'especie' })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy: CatalogItemSortField = 'especie';

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'ASC' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn(SORT_ORDERS)
  order: SortOrder = 'ASC';
}

/**
 * Validação de formato apenas. Regras de negócio (ex.: `categoria`
 * obrigatória para ASSET) ficam no domínio e respondem 422.
 */
export class CreateCatalogItemDto {
  @ApiPropertyOptional({ enum: CatalogItemType, default: CatalogItemType.ASSET })
  @IsOptional()
  @IsEnum(CatalogItemType)
  type?: CatalogItemType;

  @ApiProperty({ maxLength: CATALOG_ITEM_LIMITS.especie, example: 'ABRIDOR DE MALLAS' })
  @IsString()
  @MaxLength(CATALOG_ITEM_LIMITS.especie)
  especie: string;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: CATALOG_ITEM_LIMITS.categoria,
    description: 'Obrigatória quando type = ASSET.',
    example: 'EQUIPOS DIVERSOS',
  })
  @IsOptional()
  @IsString()
  @MaxLength(CATALOG_ITEM_LIMITS.categoria)
  categoria?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: CATALOG_ITEM_LIMITS.suplementos,
    description: 'Dados a capturar, separados por "/".',
    example: 'MCA/MOD/',
  })
  @IsOptional()
  @IsString()
  @MaxLength(CATALOG_ITEM_LIMITS.suplementos)
  suplementos?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: CATALOG_ITEM_LIMITS.fijacion,
    example: 'A CERCA DE LA PLACA DEL FABRICANTE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(CATALOG_ITEM_LIMITS.fijacion)
  fijacion?: string | null;
}

export class UpdateCatalogItemDto extends PartialType(CreateCatalogItemDto) {}

export class CatalogItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  catalogId: string;

  @ApiProperty({ enum: CatalogItemType })
  type: CatalogItemType;

  @ApiProperty()
  especie: string;

  @ApiProperty({ nullable: true, type: String })
  categoria: string | null;

  @ApiProperty({ nullable: true, type: String })
  suplementos: string | null;

  @ApiProperty({ nullable: true, type: String })
  fijacion: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CatalogItemPageResponseDto {
  @ApiProperty({ type: [CatalogItemResponseDto] })
  data: CatalogItemResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}

class FacetCountsDto {
  @ApiProperty()
  assets: number;

  @ApiProperty()
  nonObjects: number;
}

export class CatalogFacetsResponseDto {
  @ApiProperty({ type: [String], description: 'Categorias distintas dos itens ASSET, em ordem alfabética.' })
  categories: string[];

  @ApiProperty({ type: [String], description: 'Critérios de fijación distintos dos itens ASSET.' })
  fixations: string[];

  @ApiProperty({ type: FacetCountsDto })
  counts: FacetCountsDto;
}
