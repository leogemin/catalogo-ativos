import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CatalogItem, type NewCatalogItem } from '../domain/catalog-item.entity.js';
import { CatalogItemType } from '../domain/catalog-item-type.enum.js';
import { Catalog, type NewCatalog } from '../domain/catalog.entity.js';
import {
  type CatalogItemCounts,
  type CatalogPageQuery,
  CatalogRepository,
  type Page,
} from '../domain/catalog.repository.js';
import { escapeLike, insertCatalogItems } from './sql.utils.js';

@Injectable()
export class TypeOrmCatalogRepository extends CatalogRepository {
  constructor(
    @InjectRepository(Catalog) private readonly catalogs: Repository<Catalog>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();
  }

  async findPage({ search, page, pageSize }: CatalogPageQuery): Promise<Page<Catalog>> {
    const query = this.catalogs
      .createQueryBuilder('catalog')
      .orderBy('catalog.name', 'ASC')
      .addOrderBy('catalog.id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      query.where('unaccent(upper(catalog.name)) LIKE unaccent(upper(:search))', {
        search: `%${escapeLike(search)}%`,
      });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  findById(id: string): Promise<Catalog | null> {
    return this.catalogs.findOneBy({ id });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const query = this.catalogs.createQueryBuilder('catalog').where('lower(catalog.name) = lower(:name)', { name });
    if (excludeId) query.andWhere('catalog.id <> :excludeId', { excludeId });
    return (await query.getCount()) > 0;
  }

  async countItemsByType(catalogIds: string[]): Promise<Map<string, CatalogItemCounts>> {
    const counts = new Map<string, CatalogItemCounts>(catalogIds.map((id) => [id, { assets: 0, nonObjects: 0 }]));
    if (catalogIds.length === 0) return counts;

    const rows = await this.dataSource
      .getRepository(CatalogItem)
      .createQueryBuilder('item')
      .select('item.catalogId', 'catalogId')
      .addSelect('item.type', 'type')
      .addSelect('COUNT(*)::int', 'count')
      .where('item.catalogId IN (:...catalogIds)', { catalogIds })
      .groupBy('item.catalogId')
      .addGroupBy('item.type')
      .getRawMany<{ catalogId: string; type: CatalogItemType; count: number }>();

    for (const row of rows) {
      const entry = counts.get(row.catalogId);
      if (!entry) continue;
      if (row.type === CatalogItemType.ASSET) entry.assets = row.count;
      else entry.nonObjects = row.count;
    }
    return counts;
  }

  create(data: NewCatalog): Promise<Catalog> {
    return this.catalogs.save(this.catalogs.create(data));
  }

  update(catalog: Catalog, changes: Partial<NewCatalog>): Promise<Catalog> {
    return this.catalogs.save(this.catalogs.merge(catalog, changes));
  }

  async delete(id: string): Promise<void> {
    await this.catalogs.delete({ id });
  }

  createWithItems(data: NewCatalog, items: NewCatalogItem[]): Promise<Catalog> {
    return this.dataSource.transaction(async (manager) => {
      const catalog = await manager.save(manager.create(Catalog, data));
      await insertCatalogItems(manager, catalog.id, items);
      return catalog;
    });
  }
}
