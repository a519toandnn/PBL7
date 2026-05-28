import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCartItemSnapshotToOrderItems1712866800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD COLUMN IF NOT EXISTS "cart_item_id" integer
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_order_item_cart_item_id"
      ON "order_items" ("cart_item_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_order_item_cart_item_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE "order_items"
      DROP COLUMN IF EXISTS "cart_item_id"
    `);
  }
}
