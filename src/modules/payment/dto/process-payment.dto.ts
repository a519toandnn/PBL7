import { IsString } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  payment_method_code: string;
}
