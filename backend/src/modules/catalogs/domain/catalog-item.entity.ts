import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { CatalogItemType } from './catalog-item-type.enum.js';
import { Catalog } from './catalog.entity.js';

export const CATALOG_ITEM_LIMITS = {
  especie: 255,
  categoria: 120,
  suplementos: 1000,
  fijacion: 160,
} as const;

@Entity({ name: 'catalog_items' })
@Check('CHK_catalog_items_asset_has_categoria', `"type" <> 'ASSET' OR "categoria" IS NOT NULL`)
@Check('CHK_catalog_items_suplementos_length', `char_length("suplementos") <= ${CATALOG_ITEM_LIMITS.suplementos}`)
@Index('IDX_catalog_items_catalog_type_especie', ['catalogId', 'type', 'especie'])
export class CatalogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'catalog_id', type: 'uuid' })
  catalogId: string;

  @ManyToOne(() => Catalog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'catalog_id', foreignKeyConstraintName: 'FK_catalog_items_catalog' })
  catalog?: Relation<Catalog>;

  @Column({ type: 'enum', enum: CatalogItemType, enumName: 'catalog_item_type', default: CatalogItemType.ASSET })
  type: CatalogItemType;

  @Column({ type: 'varchar', length: CATALOG_ITEM_LIMITS.especie })
  especie: string;

  @Column({ type: 'varchar', length: CATALOG_ITEM_LIMITS.categoria, nullable: true })
  categoria: string | null;

  @Column({ type: 'text', nullable: true })
  suplementos: string | null;

  @Column({ type: 'varchar', length: CATALOG_ITEM_LIMITS.fijacion, nullable: true })
  fijacion: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

export interface NewCatalogItem {
  type: CatalogItemType;
  especie: string;
  categoria: string | null;
  suplementos: string | null;
  fijacion: string | null;
}
