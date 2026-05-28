import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGeminiProductSearchEmbeddings1712870400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_search_embeddings" (
        "product_id" integer PRIMARY KEY REFERENCES "products"("id") ON DELETE CASCADE,
        "search_text" text NOT NULL,
        "search_text_hash" varchar(64) NOT NULL,
        "embedding" vector(768) NOT NULL,
        "embedding_model" varchar(100) NOT NULL,
        "embedding_dimensions" integer NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_search_embedding_hnsw"
      ON "product_search_embeddings"
      USING hnsw ("embedding" vector_cosine_ops)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "search_query_embedding_cache" (
        "query_hash" varchar(64) PRIMARY KEY,
        "query_text" text NOT NULL,
        "embedding" vector(768) NOT NULL,
        "embedding_model" varchar(100) NOT NULL,
        "embedding_dimensions" integer NOT NULL,
        "hit_count" integer NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "last_used_at" timestamp NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "search_query_embedding_cache"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_product_search_embedding_hnsw"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "product_search_embeddings"`);
  }
}
