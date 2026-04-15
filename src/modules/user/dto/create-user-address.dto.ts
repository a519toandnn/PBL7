import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserAddressDto {
  @IsString()
  @MinLength(2)
  receiver_name: string;

  @IsString()
  @MinLength(10)
  receiver_phone: string;

  @IsString()
  @MinLength(10)
  address_line: string;

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
