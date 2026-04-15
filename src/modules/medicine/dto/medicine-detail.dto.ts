import { IsNumber, IsString, IsBoolean, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../entities/medicine.entity';

/**
 * DTO for a flattened price item (no nested measure_unit)
 */
export class MedicinePriceDetailDto {
  @IsNumber()
  price: number;

  @IsNumber()
  measure_id: number;

  @IsString()
  measure_name: string;

  @IsBoolean()
  is_sell_default: boolean;
}

/**
 * DTO for medical info nested object
 */
export class MedicineMedicalInfoDto {
  @IsOptional()
  @IsString()
  usage?: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  adverse_effect?: string;

  @IsOptional()
  @IsString()
  careful?: string;

  @IsOptional()
  @IsString()
  preservation?: string;
}

/**
 * DTO for category relationship
 */
export class MedicineCategoryDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}

/**
 * DTO for full medicine detail response
 * Includes all prices and all related information
 */
export class MedicineDetailDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsEnum(ProductType)
  product_type: ProductType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsBoolean()
  is_active: boolean;

  @IsString()
  created_at: string;

  @IsString()
  updated_at: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MedicineMedicalInfoDto)
  medical_info?: MedicineMedicalInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicinePriceDetailDto)
  prices: MedicinePriceDetailDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicineCategoryDto)
  categories: MedicineCategoryDto[];
}
