import { calculateMedicineSearchRerankScore } from './medicine-search-rerank.util';

describe('medicine search rerank', () => {
  it('prioritizes medicine name before strength', () => {
    const query = 'viratrill s 1500mg';
    const exactStrength = calculateMedicineSearchRerankScore({
      query,
      semanticScore: 0.7,
      productName: 'Viratrill-S 1500mg',
      normalizedSlug: 'viratrill s 1500mg',
      searchText: 'viratrill s 1500mg',
    });
    const differentStrength = calculateMedicineSearchRerankScore({
      query,
      semanticScore: 0.72,
      productName: 'Viratrill-S 1000mg',
      normalizedSlug: 'viratrill s 1000mg',
      searchText: 'viratrill s 1000mg',
    });
    const unrelatedSameStrength = calculateMedicineSearchRerankScore({
      query,
      semanticScore: 0.74,
      productName: 'Glucosamine 1500mg',
      normalizedSlug: 'glucosamine 1500mg',
      searchText: 'glucosamine 1500mg',
    });

    expect(exactStrength.score).toBeGreaterThan(differentStrength.score);
    expect(differentStrength.score).toBeGreaterThan(
      unrelatedSameStrength.score,
    );
  });

  it('does not give strength bonus when medicine name does not match', () => {
    const score = calculateMedicineSearchRerankScore({
      query: 'viratrill s 1500mg',
      semanticScore: 0.8,
      productName: 'Glucosamine 1500mg',
      normalizedSlug: 'glucosamine 1500mg',
      searchText: 'glucosamine 1500mg',
    });

    expect(score.strengthScore).toBe(0);
    expect(score.nameScore).toBeLessThan(0.3);
  });
});
