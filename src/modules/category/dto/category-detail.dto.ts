/**
 * Response DTO for category detail with smart logic
 * Returns different structure based on whether category has children
 */
export class CategoryDetailDto {
  type: 'subcategories' | 'products';
  id: number;
  name: string;
  slug: string;
  level: number;
  categories?: any[];
  message?: string;
}
