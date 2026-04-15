import { IsNumber, Min } from 'class-validator';

export class CreateOrderitemDto {
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  unit_price: number;

  @IsNumber()
  line_total: number;

  @IsNumber()
  order_id: number;

  @IsNumber()
  product_id: number;
}
