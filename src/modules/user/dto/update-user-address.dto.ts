import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  receiver_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  receiver_phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  address_line?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
