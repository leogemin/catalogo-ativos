import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, type SelectQueryBuilder } from 'typeorm';
import { CatalogItem, type NewCatalogItem } from '../domain/catalog-item.entity.js';
import {
  type CatalogFacets,
  type CatalogItemFilters,
  type CatalogItemPageQuery,
  CatalogItemRepository,
  type CatalogItemSortField,
  type ImportMode,
} from '../domain/catalog-item.repository.js';
import { CatalogItemType } from '../domain/catalog-item-type.enum.js';
import type { Page } from '../domain/catalog.repository.js';
import { escapeLike, insertCatalogItems } from './sql.utils.js';

const SORT_COLUMNS: Record<CatalogItemSortField, string> = {
  especie: 'item.especie',
  categoria: 'item.categoria',
  createdAt: 'item.createdAt',
};

@Injectable()
export class TypeOrmCatalogItemRepository extends CatalogItemRepository {
  constructor(
    @InjectRepository(CatalogItem) private readonly items: Repository<CatalogItem>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();
  }

  async findPage(catalogId: string, query: CatalogItemPageQuery): Promise<Page<CatalogItem>> {
    const builder = this.filtered(catalogId, query)
      .orderBy(SORT_COLUMNS[query.sortBy], query.order, 'NULLS LAST')
      .addOrderBy('item.id', 'ASC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await builder.getManyAndCount();
    return { items, total };
  }

  findAll(catalogId: string, type?: CatalogItemType): Promise<CatalogItem[]> {
    return this.filtered(catalogId, { type }).orderBy('item.type', 'ASC').addOrderBy('item.especie', 'ASC').getMany();
  }

  findById(catalogId: string, id: string): Promise<CatalogItem | null> {
    return this.items.findOneBy({ id, catalogId });
  }

  async facets(catalogId: string): Promise<CatalogFacets> {
    const distinct = async (column: 'categoria' | 'fijacion') => {
      const rows = await this.items
        .createQueryBuilder('item')
        .select(`DISTINCT item.${column}`, 'value')
        .where('item.catalogId = :catalogId', { catalogId })
        .andWhere('item.type = :type', { type: CatalogItemType.ASSET })
        .andWhere(`item.${column} IS NOT NULL`)
        .orderBy('value', 'ASC')
        .getRawMany<{ value: string }>();
      return rows.map((row) => row.value);
    };

    const countRows = await this.items
      .createQueryBuilder('item')
      .select('item.type', 'type')
      .addSelect('COUNT(*)::int', 'count')
      .where('item.catalogId = :catalogId', { catalogId })
      .groupBy('item.type')
      .getRawMany<{ type: CatalogItemType; count: number }>();

    const countOf = (type: CatalogItemType) => countRows.find((row) => row.type === type)?.count ?? 0;

    return {
      categories: await distinct('categoria'),
      fixations: await distinct('fijacion'),
      counts: { assets: countOf(CatalogItemType.ASSET), nonObjects: countOf(CatalogItemType.NON_OBJECT) },
    };
  }

  create(catalogId: string, data: NewCatalogItem): Promise<CatalogItem> {
    return this.items.save(this.items.create({ ...data, catalogId }));
  }

  update(item: CatalogItem, data: NewCatalogItem): Promise<CatalogItem> {
    return this.items.save(this.items.merge(item, data));
  }

  async delete(item: CatalogItem): Promise<void> {
    await this.items.delete({ id: item.id });
  }

  bulkImport(catalogId: string, items: NewCatalogItem[], mode: ImportMode): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      if (mode === 'replace') await manager.delete(CatalogItem, { catalogId });
      await insertCatalogItems(manager, catalogId, items);
      return items.length;
    });
  }

  private filtered(catalogId: string, filters: CatalogItemFilters): SelectQueryBuilder<CatalogItem> {
    const builder = this.items.createQueryBuilder('item').where('item.catalogId = :catalogId', { catalogId });

    if (filters.type) builder.andWhere('item.type = :type', { type: filters.type });
    if (filters.categoria) builder.andWhere('item.categoria = :categoria', { categoria: filters.categoria });
    if (filters.fijacion) builder.andWhere('item.fijacion = :fijacion', { fijacion: filters.fijacion });
    if (filters.letter) {
      builder.andWhere('unaccent(upper(item.especie)) LIKE :letter', { letter: `${filters.letter}%` });
    }
    if (filters.search) {
      builder.andWhere(
        "unaccent(upper(concat_ws(' ', item.especie, item.categoria, item.suplementos, item.fijacion))) LIKE unaccent(upper(:search))",
        { search: `%${escapeLike(filters.search)}%` },
      );
    }
    return builder;
  }
}
