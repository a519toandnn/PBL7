import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicineService } from './medicine.service';
import { MedicineController } from './medicine.controller';
import { MeasureUnitController } from './measure-unit.controller';
import { MeasureUnitService } from './measure-unit.service';
import { Medicine } from './entities/medicine.entity';
import { Category } from '../category/entities/category.entity';
import { ProductCategory } from '../category/entities/product-category.entity';
import { MedicinePrice } from './entities/medicine-price.entity';
import { MeasureUnit } from './entities/measure-unit.entity';
import { GeminiEmbeddingProvider } from './embedding/gemini-embedding.provider';
import { MedicineSearchIndexService } from './services/medicine-search-index.service';
import { MedicineSemanticSearchService } from './services/medicine-semantic-search.service';
import { SearchQueryEmbeddingCacheService } from './services/search-query-embedding-cache.service';

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
  controllers: [MedicineController, MeasureUnitController],
  providers: [
    MedicineService,
    MeasureUnitService,
    GeminiEmbeddingProvider,
    MedicineSearchIndexService,
    MedicineSemanticSearchService,
    SearchQueryEmbeddingCacheService,
  ],
  exports: [MedicineService],
})
export class MedicineModule {}
