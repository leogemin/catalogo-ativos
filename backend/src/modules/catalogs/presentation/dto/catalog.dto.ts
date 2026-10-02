import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageMetaDto, PaginationQueryDto } from '../../../../common/dto/pagination.dto.js';
import { Trim } from '../../../../common/dto/transforms.js';

export class ListCatalogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra pelo nome (sem acento/caixa).' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(160)
  search?: string;
}

export class CreateCatalogDto {
  @ApiProperty({ maxLength: 160, example: 'Catálogo Maestro de Activos' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 2000 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}

export class UpdateCatalogDto extends PartialType(CreateCatalogDto) {}

export class CatalogItemCountsDto {
  @ApiProperty({ description: 'Itens do tipo ASSET.' })
  assets: number;

  @ApiProperty({ description: 'Itens do tipo NON_OBJECT (bienes no objeto).' })
  nonObjects: number;
}

export class CatalogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ type: CatalogItemCountsDto })
  itemCounts: CatalogItemCountsDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CatalogPageResponseDto {
  @ApiProperty({ type: [CatalogResponseDto] })
  data: CatalogResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}
