import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentAndPriceConstraints1712863200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_payment_order_success_unique"
      ON "payment_transactions" ("order_id")
      WHERE "status" = 'SUCCESS'
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_product_price_product_unit_unique"
      ON "product_prices" ("product_id", "measure_unit_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_lower_slug"
      ON "products" (LOWER("slug"))
    `);

    await queryRunner.query(`
      INSERT INTO "payment_methods" ("code", "name", "is_active")
      VALUES
        ('COD', 'Cash on delivery', true),
        ('BANK_TRANSFER', 'Bank transfer', true),
        ('MOMO', 'MoMo', true),
        ('VNPAY', 'VNPAY', true)
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_lower_slug"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_product_price_product_unit_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_payment_order_success_unique"`,
    );
    await queryRunner.query(`
      DELETE FROM "payment_methods"
      WHERE "code" IN ('COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY')
    `);
  }
}
