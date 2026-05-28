import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  MedicineSearchResultDto,
  SearchMatchType,
} from '../dto/medicine-search.dto';
import { SearchQueryEmbeddingCacheService } from './search-query-embedding-cache.service';
import { normalizeSearchQuery } from '../utils/build-medicine-search-text';
import { extractStrengths, hasStrengthMismatch } from '../utils/dosage-parser';

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

    const embedding = await this.queryEmbeddingCache.getEmbeddingForQuery(query);
    const vectorLiteral = `[${embedding.join(',')}]`;
    const candidateLimit = 100;
    const queryTerms = extractMeaningfulTerms(query);
    const queryStrengths = extractStrengths(query);

    const rows = await this.dataSource.query(
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
            LOWER(REPLACE(m.slug, '-', ' ')) AS normalized_slug
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

    const ranked = rows
      .map((row: any) => {
        const strengthPenalty = hasStrengthMismatch(query, row.search_text)
          ? 0.25
          : 0;
        const lexicalScore = calculateLexicalScore(
          query,
          queryTerms,
          row.normalized_slug,
          row.search_text,
        );
        const strengthScore = calculateStrengthScore(
          queryTerms,
          queryStrengths,
          row.search_text,
        );

        const score =
          Number(row.semantic_score) + lexicalScore + strengthScore - strengthPenalty;

        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          image_url: row.image_url,
          product_type: row.product_type,
          price: row.price ? Number(row.price) : 0,
          measure_unit_name: row.measure_unit_name ?? '',
          is_sell_default: true,
          match_type: SearchMatchType.SEMANTIC,
          score,
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
}

function extractMeaningfulTerms(query: string): string[] {
  return query
    .replace(/\b\d+(?:[.,]\d+)?\s*(mg|g|mcg|ml|iu)\b/g, ' ')
    .split(' ')
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
}

function calculateLexicalScore(
  query: string,
  queryTerms: string[],
  normalizedSlug: string,
  searchText: string,
): number {
  const searchableText = `${normalizedSlug} ${searchText}`.toLowerCase();

  if (normalizedSlug === query) {
    return 0.7;
  }

  if (normalizedSlug.startsWith(query)) {
    return 0.55;
  }

  if (normalizedSlug.includes(query)) {
    return 0.45;
  }

  if (queryTerms.length === 0) {
    return 0;
  }

  const matchedTerms = queryTerms.filter((term) =>
    searchableText.includes(term),
  ).length;

  if (matchedTerms === queryTerms.length) {
    return 0.5;
  }

  return (matchedTerms / queryTerms.length) * 0.25;
}

function calculateStrengthScore(
  queryTerms: string[],
  queryStrengths: string[],
  productText: string,
): number {
  if (queryStrengths.length === 0) {
    return 0;
  }

  const searchableText = productText.toLowerCase();
  const hasNameTermMatch = queryTerms.some((term) =>
    searchableText.includes(term),
  );

  if (!hasNameTermMatch) {
    return 0;
  }

  const productStrengths = extractStrengths(productText);

  if (
    queryStrengths.some((strength) => productStrengths.includes(strength))
  ) {
    return 0.2;
  }

  return 0;
}
