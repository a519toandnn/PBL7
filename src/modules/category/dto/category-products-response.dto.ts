/**
 * Pagination info included in paginated responses
 */
export class PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Product information in category products listing
 */
export class ProductItemDto {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  price?: number;
  measure_unit_name?: string;
  is_sell_default?: boolean;
}

/**
 * Response DTO for paginated products in a category
 */
export class CategoryProductsResponseDto {
  data: ProductItemDto[];
  pagination: PaginationDto;
}
