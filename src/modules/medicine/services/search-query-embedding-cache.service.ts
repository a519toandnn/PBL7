import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GeminiEmbeddingProvider } from '../embedding/gemini-embedding.provider';
import { normalizeSearchQuery } from '../utils/build-medicine-search-text';

@Injectable()
export class SearchQueryEmbeddingCacheService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly embeddingProvider: GeminiEmbeddingProvider,
  ) {}

  async getEmbeddingForQuery(query: string): Promise<number[]> {
    const normalizedQuery = normalizeSearchQuery(query);
    const queryHash = createHash('sha256').update(normalizedQuery).digest('hex');
    const lockKey = createAdvisoryLockKey(queryHash);

    const cached = await this.dataSource.query(
      `
        UPDATE search_query_embedding_cache
        SET hit_count = hit_count + 1,
            last_used_at = now()
        WHERE query_hash = $1
        RETURNING embedding::text AS embedding
      `,
      [queryHash],
    );

    if (cached[0]?.embedding) {
      return parseVectorText(cached[0].embedding);
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [
        lockKey,
      ]);

      const cachedAfterLock = await manager.query(
        `
          SELECT embedding::text AS embedding
          FROM search_query_embedding_cache
          WHERE query_hash = $1
        `,
        [queryHash],
      );

      if (cachedAfterLock[0]?.embedding) {
        await manager.query(
          `
            UPDATE search_query_embedding_cache
            SET hit_count = hit_count + 1,
                last_used_at = now()
            WHERE query_hash = $1
          `,
          [queryHash],
        );

        return parseVectorText(cachedAfterLock[0].embedding);
      }

      const embedding = await this.embeddingProvider.embedText(
        normalizedQuery,
        'RETRIEVAL_QUERY',
      );
      const vectorLiteral = `[${embedding.join(',')}]`;

      await manager.query(
        `
          INSERT INTO search_query_embedding_cache (
            query_hash,
            query_text,
            embedding,
            embedding_model,
            embedding_dimensions
          )
          VALUES ($1, $2, $3::vector, $4, $5)
        `,
        [
          queryHash,
          normalizedQuery,
          vectorLiteral,
          this.embeddingProvider.getModel(),
          this.embeddingProvider.getDimensions(),
        ],
      );

      return embedding;
    });
  }
}

function createAdvisoryLockKey(hash: string): string {
  return BigInt(`0x${hash.slice(0, 15)}`).toString();
}

function parseVectorText(vectorText: string): number[] {
  return vectorText
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map(Number);
}
