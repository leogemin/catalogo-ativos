import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto.js';
import { PageMetaDto } from '../../../common/dto/pagination.dto.js';
import { CatalogItemsService } from '../application/catalog-items.service.js';
import { toCatalogItemResponse } from './catalog.mapper.js';
import {
  CatalogFacetsResponseDto,
  CatalogItemPageResponseDto,
  CatalogItemResponseDto,
  CreateCatalogItemDto,
  ListCatalogItemsQueryDto,
  UpdateCatalogItemDto,
} from './dto/catalog-item.dto.js';

@ApiTags('catalog items')
@ApiParam({ name: 'catalogId', format: 'uuid' })
@ApiBadRequestResponse({ type: ErrorResponseDto })
@ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Catálogo ou item não encontrado.' })
@Controller('catalogs/:catalogId/items')
export class CatalogItemsController {
  constructor(private readonly items: CatalogItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista itens do catálogo com filtros, busca e paginação.' })
  @ApiOkResponse({ type: CatalogItemPageResponseDto })
  async list(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @Query() query: ListCatalogItemsQueryDto,
  ): Promise<CatalogItemPageResponseDto> {
    const page = await this.items.list(catalogId, query);
    return {
      data: page.items.map(toCatalogItemResponse),
      meta: PageMetaDto.of(query.page, query.pageSize, page.total),
    };
  }

  // Declarada antes de ':itemId' para "facets" não ser tratado como id.
  @Get('facets')
  @ApiOperation({ summary: 'Opções de filtro (categorias e fijaciones distintas) e totais por tipo.' })
  @ApiOkResponse({ type: CatalogFacetsResponseDto })
  facets(@Param('catalogId', ParseUUIDPipe) catalogId: string): Promise<CatalogFacetsResponseDto> {
    return this.items.facets(catalogId);
  }

  @Get(':itemId')
  @ApiOperation({ summary: 'Detalha um item.' })
  @ApiOkResponse({ type: CatalogItemResponseDto })
  async get(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<CatalogItemResponseDto> {
    return toCatalogItemResponse(await this.items.get(catalogId, itemId));
  }

  @Post()
  @ApiOperation({ summary: 'Cria um item no catálogo.' })
  @ApiCreatedResponse({ type: CatalogItemResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  async create(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @Body() dto: CreateCatalogItemDto,
  ): Promise<CatalogItemResponseDto> {
    return toCatalogItemResponse(await this.items.create(catalogId, dto));
  }

  @Patch(':itemId')
  @ApiOperation({ summary: 'Atualiza parcialmente um item (campo omitido = mantém; null = limpa).' })
  @ApiOkResponse({ type: CatalogItemResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  async update(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCatalogItemDto,
  ): Promise<CatalogItemResponseDto> {
    return toCatalogItemResponse(await this.items.update(catalogId, itemId, dto));
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um item.' })
  @ApiNoContentResponse()
  async remove(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    await this.items.remove(catalogId, itemId);
  }
}
