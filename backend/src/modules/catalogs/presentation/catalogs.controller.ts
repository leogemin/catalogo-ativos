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
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto.js';
import { PageMetaDto } from '../../../common/dto/pagination.dto.js';
import { CatalogTransferService } from '../application/catalog-transfer.service.js';
import { CatalogsService } from '../application/catalogs.service.js';
import { toCatalogResponse } from './catalog.mapper.js';
import { CsvFilePipe } from './csv-file.pipe.js';
import {
  CatalogImportResultDto,
  ExportCatalogQueryDto,
  ImportIntoCatalogQueryDto,
  ImportNewCatalogDto,
  ImportReportDto,
} from './dto/catalog-transfer.dto.js';
import {
  CatalogPageResponseDto,
  CatalogResponseDto,
  CreateCatalogDto,
  ListCatalogsQueryDto,
  UpdateCatalogDto,
} from './dto/catalog.dto.js';

const CSV_UPLOAD_SCHEMA = {
  file: {
    type: 'string',
    format: 'binary',
    description: 'Arquivo .csv (colunas: tipo, categoria, especie, suplementos, fijacion).',
  },
};

@ApiTags('catalogs')
@ApiBadRequestResponse({ type: ErrorResponseDto })
@Controller('catalogs')
export class CatalogsController {
  constructor(
    private readonly catalogs: CatalogsService,
    private readonly transfer: CatalogTransferService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista catálogos (paginado), com contagem de itens por tipo.' })
  @ApiOkResponse({ type: CatalogPageResponseDto })
  async list(@Query() query: ListCatalogsQueryDto): Promise<CatalogPageResponseDto> {
    const page = await this.catalogs.list(query);
    return {
      data: page.items.map(toCatalogResponse),
      meta: PageMetaDto.of(query.page, query.pageSize, page.total),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um catálogo.' })
  @ApiOkResponse({ type: CatalogResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<CatalogResponseDto> {
    return toCatalogResponse(await this.catalogs.get(id));
  }

  @Post()
  @ApiOperation({ summary: 'Cria um catálogo vazio.' })
  @ApiCreatedResponse({ type: CatalogResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Já existe catálogo com esse nome.' })
  async create(@Body() dto: CreateCatalogDto): Promise<CatalogResponseDto> {
    return toCatalogResponse(await this.catalogs.create({ name: dto.name, description: dto.description ?? null }));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza nome e/ou descrição de um catálogo.' })
  @ApiOkResponse({ type: CatalogResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogDto): Promise<CatalogResponseDto> {
    return toCatalogResponse(await this.catalogs.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um catálogo e todos os seus itens.' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.catalogs.remove(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Cria um novo catálogo a partir de um CSV.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'name'],
      properties: {
        ...CSV_UPLOAD_SCHEMA,
        name: { type: 'string', maxLength: 160 },
        description: { type: 'string', maxLength: 2000 },
        skipInvalid: { type: 'boolean', default: false },
      },
    },
  })
  @ApiCreatedResponse({ type: CatalogImportResultDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto, description: 'Linhas inválidas (detalhes por linha).' })
  async importNew(
    @UploadedFile(CsvFilePipe) file: Express.Multer.File,
    @Body() dto: ImportNewCatalogDto,
  ): Promise<CatalogImportResultDto> {
    const result = await this.transfer.importAsNewCatalog(
      file.buffer,
      { name: dto.name, description: dto.description ?? null },
      { skipInvalid: dto.skipInvalid },
    );
    return { catalog: toCatalogResponse(result.catalog), report: result.report };
  }

  @Post(':id/import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importa um CSV para um catálogo existente (append ou replace).' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: CSV_UPLOAD_SCHEMA } })
  @ApiOkResponse({ type: ImportReportDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  importInto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(CsvFilePipe) file: Express.Multer.File,
    @Query() query: ImportIntoCatalogQueryDto,
  ): Promise<ImportReportDto> {
    return this.transfer.importIntoCatalog(id, file.buffer, query.mode, { skipInvalid: query.skipInvalid });
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Exporta os itens do catálogo em CSV (UTF-8 com BOM).' })
  @ApiProduces('text/csv')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async export(@Param('id', ParseUUIDPipe) id: string, @Query() query: ExportCatalogQueryDto): Promise<StreamableFile> {
    const { filename, content } = await this.transfer.exportCatalog(id, {
      type: query.type,
      delimiter: query.delimiter === 'semicolon' ? ';' : ',',
    });
    return new StreamableFile(Buffer.from(content, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
