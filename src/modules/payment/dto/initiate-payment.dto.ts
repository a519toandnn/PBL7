import { IsIn, IsOptional, IsString } from 'class-validator';

export class InitiatePaymentDto {
  @IsString()
  @IsIn(['COD', 'VNPAY'])
  payment_method_code: 'COD' | 'VNPAY';

  @IsOptional()
  @IsString()
  return_url?: string;

  @IsOptional()
  @IsString()
  bank_code?: string;
}
