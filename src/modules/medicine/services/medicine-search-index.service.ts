import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Medicine } from '../entities/medicine.entity';
import { GeminiEmbeddingProvider } from '../embedding/gemini-embedding.provider';
import { buildMedicineSearchTextFromName } from '../utils/build-medicine-search-text';

@Injectable()
export class MedicineSearchIndexService {
  private readonly logger = new Logger(MedicineSearchIndexService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly embeddingProvider: GeminiEmbeddingProvider,
  ) {}

  async reindexProduct(productId: number): Promise<void> {
    const product = await this.dataSource.getRepository(Medicine).findOne({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!product) {
      await this.deleteProductIndex(productId);
      return;
    }

    const searchText = buildMedicineSearchTextFromName(product.name);
    const hash = createHash('sha256').update(searchText).digest('hex');

    const existing = await this.dataSource.query(
      `
        SELECT search_text_hash
        FROM product_search_embeddings
        WHERE product_id = $1
      `,
      [productId],
    );

    if (existing[0]?.search_text_hash === hash) {
      return;
    }

    const embedding = await this.embeddingProvider.embedText(
      searchText,
      'RETRIEVAL_DOCUMENT',
      product.name,
    );
    const vectorLiteral = `[${embedding.join(',')}]`;

    await this.dataSource.query(
      `
        INSERT INTO product_search_embeddings (
          product_id,
          search_text,
          search_text_hash,
          embedding,
          embedding_model,
          embedding_dimensions,
          updated_at
        )
        VALUES ($1, $2, $3, $4::vector, $5, $6, now())
        ON CONFLICT (product_id)
        DO UPDATE SET
          search_text = EXCLUDED.search_text,
          search_text_hash = EXCLUDED.search_text_hash,
          embedding = EXCLUDED.embedding,
          embedding_model = EXCLUDED.embedding_model,
          embedding_dimensions = EXCLUDED.embedding_dimensions,
          updated_at = now()
      `,
      [
        productId,
        searchText,
        hash,
        vectorLiteral,
        this.embeddingProvider.getModel(),
        this.embeddingProvider.getDimensions(),
      ],
    );
  }

  async reindexProductBestEffort(productId: number): Promise<void> {
    try {
      await this.reindexProduct(productId);
    } catch (error) {
      this.logger.warn(
        `Failed to reindex product ${productId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async deleteProductIndex(productId: number): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM product_search_embeddings WHERE product_id = $1`,
      [productId],
    );
  }

  async deleteProductIndexBestEffort(productId: number): Promise<void> {
    try {
      await this.deleteProductIndex(productId);
    } catch (error) {
      this.logger.warn(
        `Failed to delete product search index ${productId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
