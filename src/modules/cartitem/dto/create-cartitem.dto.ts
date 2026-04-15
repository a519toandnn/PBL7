import { IsNumber, Min } from 'class-validator';

export class CreateCartitemDto {
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  cart_id: number;

  @IsNumber()
  product_id: number;

  @IsNumber()
  measure_unit_id: number;
}
