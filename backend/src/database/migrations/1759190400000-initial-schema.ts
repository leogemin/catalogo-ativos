import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1759190400000 implements MigrationInterface {
  name = 'InitialSchema1759190400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // unaccent: busca sem acento (ex.: "fijacion" encontra "FIJACIÓN").
    // gen_random_uuid() é nativo no PostgreSQL 13+.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);

    await queryRunner.query(`
      CREATE TABLE "catalogs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(160) NOT NULL,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalogs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_catalogs_name_lower" ON "catalogs" (lower("name"))`);

    await queryRunner.query(`CREATE TYPE "catalog_item_type" AS ENUM ('ASSET', 'NON_OBJECT')`);
    await queryRunner.query(`
      CREATE TABLE "catalog_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "catalog_id" uuid NOT NULL,
        "type" "catalog_item_type" NOT NULL DEFAULT 'ASSET',
        "especie" varchar(255) NOT NULL,
        "categoria" varchar(120),
        "suplementos" text,
        "fijacion" varchar(160),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_catalog_items_catalog" FOREIGN KEY ("catalog_id")
          REFERENCES "catalogs" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_catalog_items_asset_has_categoria"
          CHECK ("type" <> 'ASSET' OR "categoria" IS NOT NULL),
        CONSTRAINT "CHK_catalog_items_suplementos_length"
          CHECK (char_length("suplementos") <= 1000)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_items_catalog_type_especie" ON "catalog_items" ("catalog_id", "type", "especie")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog_items"`);
    await queryRunner.query(`DROP TYPE "catalog_item_type"`);
    await queryRunner.query(`DROP TABLE "catalogs"`);
  }
}
