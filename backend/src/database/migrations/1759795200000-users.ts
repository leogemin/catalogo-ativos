import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Users1759795200000 implements MigrationInterface {
  name = 'Users1759795200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // O usuário "admin" é criado na subida da API a partir de ADMIN_PASSWORD
    // (ver AdminBootstrapService), para não versionar senha em migration.
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "username" varchar(50) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_users_username_lower" CHECK ("username" = lower("username"))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_username" ON "users" ("username")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
