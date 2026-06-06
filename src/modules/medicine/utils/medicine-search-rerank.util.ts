import { extractStrengths, hasStrengthMismatch } from './dosage-parser';
import { normalizeSearchQuery } from './build-medicine-search-text';

interface RerankInput {
  query: string;
  semanticScore: number;
  productName: string;
  normalizedSlug: string;
  searchText: string;
}

interface RerankScore {
  score: number;
  nameScore: number;
  strengthScore: number;
  strengthPenalty: number;
}

export function calculateMedicineSearchRerankScore(
  input: RerankInput,
): RerankScore {
  const query = normalizeSearchQuery(input.query);
  const productName = normalizeSearchQuery(input.productName);
  const normalizedSlug = normalizeSearchQuery(input.normalizedSlug);
  const searchText = normalizeSearchQuery(input.searchText);
  const queryStrengths = extractStrengths(query);
  const queryName = normalizeMedicineNameWithoutStrength(query);

  const nameScore = calculateNameScore({
    query,
    queryName,
    productName,
    normalizedSlug,
    searchText,
  });
  const hasReliableNameMatch = nameScore >= 1.2;
  const strengthScore = calculateStrengthScore(
    queryStrengths,
    searchText,
    hasReliableNameMatch,
  );
  const strengthPenalty =
    hasReliableNameMatch && hasStrengthMismatch(query, searchText) ? 0.15 : 0;

  return {
    score:
      Number(input.semanticScore) + nameScore + strengthScore - strengthPenalty,
    nameScore,
    strengthScore,
    strengthPenalty,
  };
}

function calculateNameScore(input: {
  query: string;
  queryName: string;
  productName: string;
  normalizedSlug: string;
  searchText: string;
}): number {
  if (!input.queryName) {
    return 0;
  }

  const productNameWithoutStrength = normalizeMedicineNameWithoutStrength(
    input.productName,
  );
  const slugWithoutStrength = normalizeMedicineNameWithoutStrength(
    input.normalizedSlug,
  );
  const searchTextWithoutStrength = normalizeMedicineNameWithoutStrength(
    input.searchText,
  );
  const searchableNameText =
    `${productNameWithoutStrength} ${slugWithoutStrength} ${searchTextWithoutStrength}`.trim();

  if (
    productNameWithoutStrength === input.queryName ||
    slugWithoutStrength === input.queryName ||
    searchTextWithoutStrength === input.queryName
  ) {
    return 3;
  }

  if (
    productNameWithoutStrength.startsWith(input.queryName) ||
    slugWithoutStrength.startsWith(input.queryName) ||
    searchTextWithoutStrength.startsWith(input.queryName)
  ) {
    return 2.4;
  }

  if (
    productNameWithoutStrength.includes(input.queryName) ||
    slugWithoutStrength.includes(input.queryName) ||
    searchTextWithoutStrength.includes(input.queryName)
  ) {
    return 1.8;
  }

  const queryTerms = extractNameTerms(input.queryName);
  if (queryTerms.length === 0) {
    return 0;
  }

  const matchedTerms = queryTerms.filter((term) =>
    searchableNameText.includes(term),
  ).length;
  const ratio = matchedTerms / queryTerms.length;

  if (ratio === 1) {
    return 1.4;
  }

  if (ratio >= 0.5) {
    return 0.7;
  }

  return ratio * 0.35;
}

function calculateStrengthScore(
  queryStrengths: string[],
  productText: string,
  hasReliableNameMatch: boolean,
): number {
  if (!hasReliableNameMatch || queryStrengths.length === 0) {
    return 0;
  }

  const productStrengths = extractStrengths(productText);

  if (queryStrengths.some((strength) => productStrengths.includes(strength))) {
    return 0.4;
  }

  return 0;
}

export function normalizeMedicineNameWithoutStrength(text: string): string {
  return normalizeSearchQuery(text)
    .replace(/\b\d+(?:[.,]\d+)?\s*(mg|g|mcg|ml|iu)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractNameTerms(name: string): string[] {
  return name
    .split(' ')
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
}
