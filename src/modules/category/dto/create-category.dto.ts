import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsNumber()
  parent_id?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  level?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
