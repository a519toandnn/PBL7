import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderShippingAddresses1712874000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_shipping_addresses" (
        "id" SERIAL PRIMARY KEY,
        "order_id" integer NOT NULL UNIQUE,
        "receiver_name" varchar(255) NOT NULL,
        "receiver_phone" varchar(30) NOT NULL,
        "address_line" text NOT NULL,
        "ward" varchar(100),
        "province" varchar(100),
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_order_shipping_addresses_order"
          FOREIGN KEY ("order_id")
          REFERENCES "orders"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_order_shipping_addresses_order_id"
      ON "order_shipping_addresses" ("order_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_order_shipping_addresses_order_id"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "order_shipping_addresses"`,
    );
  }
}
