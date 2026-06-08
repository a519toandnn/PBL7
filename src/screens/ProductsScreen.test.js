import { getProductPaginationPages } from './ProductsScreen';

describe('getProductPaginationPages', () => {
    it('keeps the first pages and last page near the beginning', () => {
        expect(getProductPaginationPages(1, 64)).toEqual([1, 2, 3, 64]);
    });

    it('keeps the first page, last page, and nearby pages in the middle', () => {
        expect(getProductPaginationPages(6, 64)).toEqual([1, 4, 5, 6, 7, 8, 64]);
    });

    it('keeps the first page and last pages near the end', () => {
        expect(getProductPaginationPages(64, 64)).toEqual([1, 62, 63, 64]);
    });
});
