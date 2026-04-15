import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

class CreateOrderItemInputDto {
  @IsNumber()
  product_id: number;

  @IsNumber()
  measure_unit_id: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsArray()
  items: CreateOrderItemInputDto[];
}
