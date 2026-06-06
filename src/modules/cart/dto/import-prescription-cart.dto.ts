import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PrescriptionMedicineItemDto {
  @IsString()
  ten_thuoc: string;

  @IsString()
  don_vi_tinh: string;

  @IsNotEmpty()
  so_luong: string | number;
}

export class ImportPrescriptionDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionMedicineItemDto)
  danh_sach_thuoc: PrescriptionMedicineItemDto[];
}

export class ImportPrescriptionCartDto {
  @IsOptional()
  @IsString()
  status?: string;

  @ValidateNested()
  @Type(() => ImportPrescriptionDataDto)
  data: ImportPrescriptionDataDto;
}
