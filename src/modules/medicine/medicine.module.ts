import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicineService } from './medicine.service';
import { MedicineController } from './medicine.controller';
import { Medicine } from './entities/medicine.entity';
import { Category } from '../category/entities/category.entity';
import { ProductCategory } from '../category/entities/product-category.entity';
import { MedicinePrice } from './entities/medicine-price.entity';
import { MeasureUnit } from './entities/measure-unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Medicine,
      Category,
      ProductCategory,
      MedicinePrice,
      MeasureUnit,
    ]),
  ],
  controllers: [MedicineController],
  providers: [MedicineService],
  exports: [MedicineService],
})
export class MedicineModule {}
