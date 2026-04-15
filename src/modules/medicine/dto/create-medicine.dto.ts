import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ProductType } from '../entities/medicine.entity';
import { MedicineMedicalInfoDto } from './medicine-detail.dto';

class MedicinePriceInputDto {
  @IsNumber()
  measure_unit_id: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsBoolean()
  is_sell_default?: boolean;
}

export class CreateMedicineDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsEnum(ProductType)
  product_type?: ProductType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  category_ids?: number[];

  @IsOptional()
  @IsArray()
  prices?: MedicinePriceInputDto[];

  @IsOptional()
  medical_info?: MedicineMedicalInfoDto;
}
