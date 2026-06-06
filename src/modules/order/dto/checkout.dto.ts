import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  cart_item_ids: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  address_id?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
