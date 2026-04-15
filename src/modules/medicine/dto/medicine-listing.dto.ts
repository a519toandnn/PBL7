import { IsNumber, IsString, IsBoolean, IsEnum } from 'class-validator';
import { ProductType } from '../entities/medicine.entity';

/**
 * DTO for a single medicine in listing response
 * Contains only essential fields + default price
 */
export class MedicineListItemDto {
  @IsNumber()
  id: number;

  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsString()
  image_url: string;

  @IsEnum(ProductType)
  product_type: ProductType;

  @IsNumber()
  price: number;

  @IsString()
  measure_unit_name: string;

  @IsBoolean()
  is_sell_default: boolean;
}

/**
 * Pagination metadata DTO
 */
export class PaginationMetadataDto {
  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  totalPages: number;
}

/**
 * Paginated medicine list response DTO
 */
export class PaginatedMedicineListDto {
  data: MedicineListItemDto[];
  pagination: PaginationMetadataDto;
}
