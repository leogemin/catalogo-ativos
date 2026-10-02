import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'catalogs' })
export class Catalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Unicidade case-insensitive via índice em lower(name), criado na migration.
  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

export interface NewCatalog {
  name: string;
  description: string | null;
}
