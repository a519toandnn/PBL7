import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  MedicineSearchResultDto,
  SearchMatchType,
} from '../dto/medicine-search.dto';
import { ProductType } from '../entities/medicine.entity';
import { SearchQueryEmbeddingCacheService } from './search-query-embedding-cache.service';
import { normalizeSearchQuery } from '../utils/build-medicine-search-text';
import {
  calculateMedicineSearchRerankScore,
  normalizeMedicineNameWithoutStrength,
} from '../utils/medicine-search-rerank.util';

interface SearchCandidateRow {
  id: number;
  slug: string;
  name: string;
  image_url: string | null;
  product_type: string;
  price: string | number | null;
  measure_unit_name: string | null;
  search_text: string;
  semantic_score: string | number | null;
  lexical_rank: string | number | null;
  normalized_slug: string;
  source: 'lexical' | 'semantic';
}

@Injectable()
export class MedicineSemanticSearchService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly queryEmbeddingCache: SearchQueryEmbeddingCacheService,
  ) {}

  async search(
    rawQuery: string,
    page = 1,
    limit = 5,
  ): Promise<MedicineSearchResultDto> {
    const query = normalizeSearchQuery(rawQuery ?? '');

    if (query.length < 2) {
      return {
        query,
        data: [],
        pagination: { total: 0, page: 1, limit, totalPages: 0 },
      };
    }

    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    if (limit > 5) {
      throw new BadRequestException('limit must be less than or equal to 5');
    }

    const candidateLimit = 100;
    const lexicalRows = await this.searchLexicalCandidates(
      query,
      candidateLimit,
    );
    const semanticRows = await this.searchSemanticCandidates(
      query,
      candidateLimit,
    );
    const rows = this.mergeCandidateRows([...lexicalRows, ...semanticRows]);

    const ranked = rows
      .map((row) => {
        const rerank = calculateMedicineSearchRerankScore({
          query,
          semanticScore: Number(row.semantic_score ?? 0),
          productName: row.name,
          normalizedSlug: row.normalized_slug,
          searchText: row.search_text,
        });
        const lexicalBoost =
          row.source === 'lexical'
            ? Math.max(0, 0.45 - Number(row.lexical_rank ?? 10) * 0.04)
            : 0;

        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          image_url: row.image_url ?? '',
          product_type: row.product_type as ProductType,
          price: row.price ? Number(row.price) : 0,
          measure_unit_name: row.measure_unit_name ?? '',
          is_sell_default: true,
          match_type:
            row.source === 'lexical'
              ? this.getLexicalMatchType(Number(row.lexical_rank ?? 3))
              : SearchMatchType.SEMANTIC,
          score: rerank.score + lexicalBoost,
        };
      })
      .sort((a, b) => b.score - a.score);

    const topResults = ranked.slice(0, limit);

    return {
      query,
      data: topResults,
      pagination: {
        total: topResults.length,
        page: 1,
        limit,
        totalPages: topResults.length > 0 ? 1 : 0,
      },
    };
  }

  private async searchLexicalCandidates(
    query: string,
    candidateLimit: number,
  ): Promise<SearchCandidateRow[]> {
    const queryName = normalizeMedicineNameWithoutStrength(query);
    const terms = queryName
      .split(' ')
      .map((term) => term.trim())
      .filter((term) => term.length >= 2)
      .slice(0, 6);
    const termConditions = terms.map(
      (_, index) => `searchable.search_text LIKE $${index + 4}`,
    );
    const allTermsCondition =
      termConditions.length > 0 ? termConditions.join(' AND ') : 'false';

    return this.dataSource.query(
      `
        WITH searchable AS (
          SELECT
            m.id,
            m.slug,
            m.name,
            m.image_url,
            m.product_type,
            p.price,
            mu.name AS measure_unit_name,
            COALESCE(
              pse.search_text,
              LOWER(REGEXP_REPLACE(REPLACE(m.slug, '-', ' '), '[^a-z0-9]+', ' ', 'g'))
            ) AS search_text,
            LOWER(REPLACE(m.slug, '-', ' ')) AS normalized_slug
          FROM products m
          LEFT JOIN product_search_embeddings pse ON pse.product_id = m.id
          LEFT JOIN product_prices p
            ON p.product_id = m.id AND p.is_sell_default = true
          LEFT JOIN measure_units mu ON mu.id = p.measure_unit_id
          WHERE m.is_active = true
            AND m.deleted_at IS NULL
        )
        SELECT
          *,
          NULL::float AS semantic_score,
          CASE
            WHEN searchable.search_text = $1 THEN 0
            WHEN searchable.search_text = $2 THEN 1
            WHEN searchable.search_text LIKE $3 THEN 2
            WHEN ${allTermsCondition} THEN 3
            WHEN searchable.normalized_slug LIKE $3 THEN 4
            ELSE 5
          END AS lexical_rank,
          'lexical' AS source
        FROM searchable
        WHERE searchable.search_text = $1
          OR searchable.search_text = $2
          OR searchable.search_text LIKE $3
          OR searchable.normalized_slug LIKE $3
          OR (${allTermsCondition})
        ORDER BY lexical_rank ASC, id ASC
        LIMIT $${terms.length + 4}
      `,
      [
        query,
        queryName,
        `%${queryName || query}%`,
        ...terms.map((term) => `%${term}%`),
        candidateLimit,
      ],
    );
  }

  private async searchSemanticCandidates(
    query: string,
    candidateLimit: number,
  ): Promise<SearchCandidateRow[]> {
    try {
      const embedding = await this.queryEmbeddingCache.getEmbeddingForQuery(
        query,
      );
      const vectorLiteral = `[${embedding.join(',')}]`;

      return this.dataSource.query(
        `
          WITH candidates AS (
            SELECT
              m.id,
              m.slug,
              m.name,
              m.image_url,
              m.product_type,
              p.price,
              mu.name AS measure_unit_name,
              pse.search_text,
              1 - (pse.embedding <=> $1::vector) AS semantic_score,
              NULL::int AS lexical_rank,
              LOWER(REPLACE(m.slug, '-', ' ')) AS normalized_slug,
              'semantic' AS source
            FROM product_search_embeddings pse
            JOIN products m ON m.id = pse.product_id
            LEFT JOIN product_prices p
              ON p.product_id = m.id AND p.is_sell_default = true
            LEFT JOIN measure_units mu ON mu.id = p.measure_unit_id
            WHERE m.is_active = true
              AND m.deleted_at IS NULL
            ORDER BY pse.embedding <=> $1::vector
            LIMIT $2
          )
          SELECT *
          FROM candidates
        `,
        [vectorLiteral, candidateLimit],
      );
    } catch {
      return [];
    }
  }

  private mergeCandidateRows(rows: SearchCandidateRow[]): SearchCandidateRow[] {
    const bestById = new Map<number, SearchCandidateRow>();

    for (const row of rows) {
      const existing = bestById.get(Number(row.id));
      if (!existing) {
        bestById.set(Number(row.id), row);
        continue;
      }

      const existingSemanticScore = Number(existing.semantic_score ?? 0);
      const rowSemanticScore = Number(row.semantic_score ?? 0);
      const existingLexicalRank = Number(existing.lexical_rank ?? 99);
      const rowLexicalRank = Number(row.lexical_rank ?? 99);

      bestById.set(Number(row.id), {
        ...existing,
        semantic_score: Math.max(existingSemanticScore, rowSemanticScore),
        lexical_rank: Math.min(existingLexicalRank, rowLexicalRank),
        source:
          existing.source === 'lexical' || row.source === 'lexical'
            ? 'lexical'
            : 'semantic',
      });
    }

    return Array.from(bestById.values());
  }

  private getLexicalMatchType(lexicalRank: number): SearchMatchType {
    if (lexicalRank <= 1) {
      return SearchMatchType.EXACT;
    }

    if (lexicalRank === 2) {
      return SearchMatchType.PREFIX;
    }

    return SearchMatchType.PARTIAL;
  }
}
