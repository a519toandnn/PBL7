import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, In } from 'typeorm';
import { Medicine } from './entities/medicine.entity';
import { Category } from '../category/entities/category.entity';
import { ProductCategory } from '../category/entities/product-category.entity';
import { MedicinePrice } from './entities/medicine-price.entity';
import { MeasureUnit } from './entities/measure-unit.entity';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import {
  MedicineListItemDto,
  PaginatedMedicineListDto,
} from './dto/medicine-listing.dto';
import {
  MedicineDetailDto,
  MedicinePriceDetailDto,
  MedicineCategoryDto,
} from './dto/medicine-detail.dto';
import {
  MedicineSearchResultDto,
  MedicineSearchItemDto,
  SearchMatchType,
} from './dto/medicine-search.dto';
import { MedicineSearchIndexService } from './services/medicine-search-index.service';
import { MedicineSemanticSearchService } from './services/medicine-semantic-search.service';

@Injectable()
export class MedicineService {
  private readonly logger = new Logger(MedicineService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly semanticSearchService: MedicineSemanticSearchService,
    private readonly searchIndexService: MedicineSearchIndexService,
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ProductCategory)
    private readonly productCategoryRepository: Repository<ProductCategory>,
    @InjectRepository(MedicinePrice)
    private readonly medicinePriceRepository: Repository<MedicinePrice>,
    @InjectRepository(MeasureUnit)
    private readonly measureUnitRepository: Repository<MeasureUnit>,
  ) {}

  async create(createMedicineDto: CreateMedicineDto): Promise<Medicine> {
    const medicineId = await this.dataSource.transaction(async (manager) => {
      const medicineRepository = manager.getRepository(Medicine);
      const exists = await medicineRepository.findOne({
        where: { slug: createMedicineDto.slug },
      });
      if (exists) {
        throw new BadRequestException('Slug already exists');
      }

      const medicine = medicineRepository.create({
        name: createMedicineDto.name,
        slug: createMedicineDto.slug,
        product_type: createMedicineDto.product_type,
        description: createMedicineDto.description ?? null,
        image_url: createMedicineDto.image_url ?? null,
        is_active: createMedicineDto.is_active ?? true,
        usage: createMedicineDto.medical_info?.usage ?? null,
        dosage: createMedicineDto.medical_info?.dosage ?? null,
        adverse_effect: createMedicineDto.medical_info?.adverse_effect ?? null,
        careful: createMedicineDto.medical_info?.careful ?? null,
        preservation: createMedicineDto.medical_info?.preservation ?? null,
      });
      const savedMedicine = await medicineRepository.save(medicine);

      await this.syncProductCategories(
        manager,
        savedMedicine.id,
        createMedicineDto.category_ids ?? [],
      );
      await this.syncProductPrices(
        manager,
        savedMedicine.id,
        createMedicineDto.prices ?? [],
      );

      return savedMedicine.id;
    });

    const result = await this.findOne(medicineId);
    await this.reindexProductIfSemanticEnabled(medicineId);
    return result;
  }

  async findAll(): Promise<Medicine[]> {
    return this.medicineRepository.find({
      relations: [
        'prices',
        'prices.measure_unit',
        'category_links',
        'category_links.category',
      ],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Medicine> {
    const medicine = await this.medicineRepository.findOne({
      where: { id },
      relations: [
        'prices',
        'prices.measure_unit',
        'category_links',
        'category_links.category',
      ],
    });
    if (!medicine) {
      throw new NotFoundException(`Medicine with ID ${id} not found`);
    }
    return medicine;
  }

  async update(
    id: number,
    updateMedicineDto: UpdateMedicineDto,
  ): Promise<Medicine> {
    const medicineId = await this.dataSource.transaction(async (manager) => {
      const medicineRepository = manager.getRepository(Medicine);
      const medicine = await medicineRepository.findOne({ where: { id } });
      if (!medicine) {
        throw new NotFoundException(`Medicine with ID ${id} not found`);
      }

      if (updateMedicineDto.slug && updateMedicineDto.slug !== medicine.slug) {
        const existing = await medicineRepository.findOne({
          where: { slug: updateMedicineDto.slug },
          select: { id: true },
        });
        if (existing && existing.id !== id) {
          throw new BadRequestException('Slug already exists');
        }
      }

      Object.assign(medicine, {
        name: updateMedicineDto.name ?? medicine.name,
        slug: updateMedicineDto.slug ?? medicine.slug,
        product_type: updateMedicineDto.product_type ?? medicine.product_type,
        description: updateMedicineDto.description ?? medicine.description,
        image_url: updateMedicineDto.image_url ?? medicine.image_url,
        is_active: updateMedicineDto.is_active ?? medicine.is_active,
        usage: updateMedicineDto.medical_info?.usage ?? medicine.usage,
        dosage: updateMedicineDto.medical_info?.dosage ?? medicine.dosage,
        adverse_effect:
          updateMedicineDto.medical_info?.adverse_effect ??
          medicine.adverse_effect,
        careful: updateMedicineDto.medical_info?.careful ?? medicine.careful,
        preservation:
          updateMedicineDto.medical_info?.preservation ?? medicine.preservation,
      });

      await medicineRepository.save(medicine);

      if (updateMedicineDto.category_ids !== undefined) {
        await this.syncProductCategories(
          manager,
          medicine.id,
          updateMedicineDto.category_ids,
        );
      }

      if (updateMedicineDto.prices !== undefined) {
        await this.syncProductPrices(
          manager,
          medicine.id,
          updateMedicineDto.prices,
        );
      }

      return medicine.id;
    });

    const result = await this.findOne(medicineId);
    await this.reindexProductIfSemanticEnabled(medicineId);
    return result;
  }

  async remove(id: number): Promise<void> {
    const medicine = await this.findOne(id);
    await this.medicineRepository.softRemove(medicine);
    await this.deleteProductIndexIfSemanticEnabled(id);
  }

  private async syncProductCategories(
    manager: EntityManager,
    productId: number,
    categoryIds: number[],
  ) {
    const productCategoryRepository = manager.getRepository(ProductCategory);
    const categoryRepository = manager.getRepository(Category);
    const uniqueCategoryIds = [...new Set(categoryIds)];
    if (uniqueCategoryIds.length !== categoryIds.length) {
      throw new BadRequestException('Duplicate category IDs are not allowed');
    }

    await productCategoryRepository.delete({ product_id: productId });

    if (uniqueCategoryIds.length === 0) {
      return;
    }

    const categories = await categoryRepository.find({
      where: { id: In(uniqueCategoryIds) },
    });
    if (categories.length !== uniqueCategoryIds.length) {
      throw new BadRequestException('One or more categories do not exist');
    }

    const links = uniqueCategoryIds.map((categoryId, index) =>
      productCategoryRepository.create({
        product_id: productId,
        category_id: categoryId,
        is_primary: index === 0,
      }),
    );
    await productCategoryRepository.save(links);
  }

  private async syncProductPrices(
    manager: EntityManager,
    productId: number,
    prices: Array<{
      measure_unit_id: number;
      price: number;
      is_sell_default?: boolean;
    }>,
  ) {
    const medicinePriceRepository = manager.getRepository(MedicinePrice);
    const measureUnitRepository = manager.getRepository(MeasureUnit);
    const unitIds = prices.map((price) => price.measure_unit_id);
    const uniqueUnitIds = [...new Set(unitIds)];
    if (uniqueUnitIds.length !== unitIds.length) {
      throw new BadRequestException('Duplicate measure units are not allowed');
    }

    await medicinePriceRepository.delete({ product: { id: productId } });

    if (prices.length === 0) {
      return;
    }

    const defaultCount = prices.filter((price) => price.is_sell_default).length;
    if (defaultCount > 1) {
      throw new BadRequestException('Only one default selling unit is allowed');
    }

    const units = await measureUnitRepository.find({
      where: { id: In(uniqueUnitIds) },
    });
    if (units.length !== uniqueUnitIds.length) {
      throw new BadRequestException('One or more measure units do not exist');
    }

    const unitMap = new Map(units.map((unit) => [unit.id, unit]));
    const priceEntities = prices.map((price, index) =>
      medicinePriceRepository.create({
        product: { id: productId } as Medicine,
        measure_unit: unitMap.get(price.measure_unit_id) as MeasureUnit,
        price: price.price,
        is_sell_default:
          defaultCount === 0 ? index === 0 : Boolean(price.is_sell_default),
      }),
    );

    await medicinePriceRepository.save(priceEntities);
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedMedicineListDto> {
    const skip = (page - 1) * limit;

    const query = this.medicineRepository
      .createQueryBuilder('m')
      .leftJoin('m.prices', 'p', 'p.is_sell_default = :default', {
        default: true,
      })
      .leftJoin('p.measure_unit', 'mu')
      .select('m.id', 'id')
      .addSelect('m.slug', 'slug')
      .addSelect('m.name', 'name')
      .addSelect('m.image_url', 'image_url')
      .addSelect('m.product_type', 'product_type')
      .addSelect('m.created_at', 'created_at')
      .addSelect('p.price', 'price')
      .addSelect('mu.name', 'measure_unit_name')
      .where('m.is_active = :active', { active: true })
      .andWhere('m.deleted_at IS NULL')
      .orderBy('m.id', 'ASC')
      .offset(skip)
      .limit(limit);

    const [rows, countResult] = await Promise.all([
      query.getRawMany(),
      this.medicineRepository
        .createQueryBuilder('m')
        .select('COUNT(m.id)', 'total')
        .where('m.is_active = :active', { active: true })
        .andWhere('m.deleted_at IS NULL')
        .getRawOne(),
    ]);

    const data = rows.map(
      (row: any) =>
        ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          image_url: row.image_url,
          product_type: row.product_type,
          price: row.price ? Number(row.price) : 0,
          measure_unit_name: row.measure_unit_name ?? '',
          is_sell_default: true,
        }) as MedicineListItemDto,
    );

    const total = Number(countResult?.total ?? 0);
    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchBySlug(
    searchSlug: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<MedicineSearchResultDto> {
    if (!searchSlug || searchSlug.trim().length === 0) {
      return {
        query: searchSlug ?? '',
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const skip = (page - 1) * limit;
    const term = searchSlug.toLowerCase().trim();
    const slugPattern = `${term}%`;
    const partialPattern = `%${term}%`;

    const query = this.medicineRepository
      .createQueryBuilder('m')
      .leftJoin('m.prices', 'p', 'p.is_sell_default = :default', {
        default: true,
      })
      .leftJoin('p.measure_unit', 'mu')
      .select('m.id', 'id')
      .addSelect('m.slug', 'slug')
      .addSelect('m.name', 'name')
      .addSelect('m.image_url', 'image_url')
      .addSelect('m.product_type', 'product_type')
      .addSelect('p.price', 'price')
      .addSelect('mu.name', 'measure_unit_name')
      .addSelect(
        `CASE 
          WHEN LOWER(m.slug) = :exactSlug THEN '${SearchMatchType.EXACT}'
          WHEN LOWER(m.slug) LIKE :slugPattern THEN '${SearchMatchType.PREFIX}'
          ELSE '${SearchMatchType.PARTIAL}'
        END`,
        'match_type',
      )
      .where('LOWER(m.slug) LIKE :partialPattern', { partialPattern })
      .andWhere('m.is_active = :active', { active: true })
      .andWhere('m.deleted_at IS NULL')
      .orderBy(
        `CASE 
          WHEN LOWER(m.slug) = :exactSlug THEN 0
          WHEN LOWER(m.slug) LIKE :slugPattern THEN 1
          ELSE 2
        END`,
        'ASC',
      )
      .addOrderBy('m.id', 'ASC')
      .offset(skip)
      .limit(limit)
      .setParameter('exactSlug', term)
      .setParameter('slugPattern', slugPattern)
      .setParameter('partialPattern', partialPattern)
      .setParameter('active', true)
      .setParameter('default', true);

    const [rows, countResult] = await Promise.all([
      query.getRawMany(),
      this.medicineRepository
        .createQueryBuilder('m')
        .select('COUNT(m.id)', 'total')
        .where('LOWER(m.slug) LIKE :partialPattern', { partialPattern })
        .andWhere('m.is_active = :active', { active: true })
        .andWhere('m.deleted_at IS NULL')
        .getRawOne(),
    ]);

    const data = rows.map(
      (row: any) =>
        ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          image_url: row.image_url,
          product_type: row.product_type,
          price: row.price ? Number(row.price) : 0,
          measure_unit_name: row.measure_unit_name ?? '',
          is_sell_default: true,
          match_type: row.match_type as SearchMatchType,
        }) as MedicineSearchItemDto,
    );

    const total = Number(countResult?.total ?? 0);
    return {
      query: searchSlug,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(
    searchText: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<MedicineSearchResultDto> {
    if (!this.isSemanticSearchEnabled()) {
      return this.searchBySlug(searchText, page, limit);
    }

    try {
      return await this.semanticSearchService.search(searchText, page, limit);
    } catch (error) {
      const fallbackEnabled =
        this.configService.get<string>('SEMANTIC_SEARCH_FALLBACK_ENABLED') !==
        'false';

      if (!fallbackEnabled) {
        throw error;
      }

      this.logger.warn(
        `Semantic search failed, falling back to slug search: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return this.searchBySlug(searchText, page, limit);
    }
  }

  private isSemanticSearchEnabled(): boolean {
    return this.configService.get<string>('SEMANTIC_SEARCH_ENABLED') === 'true';
  }

  private async reindexProductIfSemanticEnabled(productId: number) {
    if (!this.isSemanticSearchEnabled()) {
      return;
    }

    await this.searchIndexService.reindexProductBestEffort(productId);
  }

  private async deleteProductIndexIfSemanticEnabled(productId: number) {
    if (!this.isSemanticSearchEnabled()) {
      return;
    }

    await this.searchIndexService.deleteProductIndexBestEffort(productId);
  }

  async findBySlug(slug: string): Promise<MedicineDetailDto> {
    const medicine = await this.medicineRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.prices', 'p')
      .leftJoinAndSelect('p.measure_unit', 'mu')
      .leftJoinAndSelect('m.category_links', 'pc')
      .leftJoinAndSelect('pc.category', 'c')
      .where('m.slug = :slug', { slug })
      .andWhere('m.is_active = :active', { active: true })
      .andWhere('m.deleted_at IS NULL')
      .getOne();

    if (!medicine) {
      throw new NotFoundException(`Medicine with slug "${slug}" not found`);
    }

    // Transform: Flatten prices structure
    const transformedPrices: MedicinePriceDetailDto[] = (
      medicine.prices || []
    ).map((price) => ({
      price: Number(price.price),
      measure_id: price.measure_unit.id,
      measure_name: price.measure_unit.name,
      is_sell_default: price.is_sell_default,
    }));

    // Transform: Categories (ALL categories, not just first 2)
    const transformedCategories: MedicineCategoryDto[] = (
      medicine.category_links || []
    ).map((link) => ({
      id: link.category.id,
      name: link.category.name,
      slug: link.category.slug,
      is_primary: link.is_primary,
    }));

    // Transform: Medical info from denormalized columns
    const transformedMedicalInfo = {
      usage: medicine.usage || undefined,
      dosage: medicine.dosage || undefined,
      adverse_effect: medicine.adverse_effect || undefined,
      careful: medicine.careful || undefined,
      preservation: medicine.preservation || undefined,
    };

    return {
      id: medicine.id,
      name: medicine.name,
      slug: medicine.slug,
      product_type: medicine.product_type,
      description: medicine.description || '',
      image_url: medicine.image_url || '',
      is_active: medicine.is_active,
      created_at: medicine.created_at.toISOString(),
      updated_at: medicine.updated_at.toISOString(),
      medical_info: transformedMedicalInfo,
      prices: transformedPrices,
      categories: transformedCategories,
    };
  }
}
