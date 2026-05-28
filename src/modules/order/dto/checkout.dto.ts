import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CheckoutDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  cart_item_ids: number[];

  @IsOptional()
  @IsString()
  note?: string;
}
