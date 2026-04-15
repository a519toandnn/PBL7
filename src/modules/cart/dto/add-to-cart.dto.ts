import { IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsNumber()
  @Min(1)
  product_id: number;

  @IsNumber()
  @Min(1)
  measure_unit_id: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}
