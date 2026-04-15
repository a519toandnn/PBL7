import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    let parent: Category | null = null;
    if (createCategoryDto.parent_id) {
      parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parent_id },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = new Category();
    category.name = createCategoryDto.name;
    category.slug = createCategoryDto.slug;
    if (parent) {
      category.parent = parent;
      category.level = createCategoryDto.level ?? parent.level + 1;
    } else {
      category.level = createCategoryDto.level ?? 1;
    }
    category.is_active = createCategoryDto.is_active ?? true;

    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { level: 1, is_active: true },
      relations: ['children'],
      order: { name: 'ASC' },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    if (updateCategoryDto.parent_id) {
      const parent = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parent_id },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
      category.parent = parent;
      category.level = updateCategoryDto.level ?? parent.level + 1;
    }

    category.name = updateCategoryDto.name ?? category.name;
    category.slug = updateCategoryDto.slug ?? category.slug;
    category.is_active = updateCategoryDto.is_active ?? category.is_active;
    if (updateCategoryDto.level) {
      category.level = updateCategoryDto.level;
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findById(id);
    await this.categoryRepository.remove(category);
  }

  // ============================================================
  // OPTIMIZED QUERIES - Hierarchical category browsing
  // ============================================================

  /**
   * Get root categories only (level = 1)
   * Used for category navigation starting point
   */
  async findRootCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { level: 1, is_active: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get children categories by parent slug
   * Used for hierarchical navigation
   */
  async findChildrenByParentSlug(parentSlug: string): Promise<Category[]> {
    const parent = await this.categoryRepository.findOne({
      where: { slug: parentSlug, is_active: true },
    });

    if (!parent) {
      throw new NotFoundException(`Parent category with slug "${parentSlug}" not found`);
    }

    return this.categoryRepository.find({
      where: { parent: { id: parent.id }, is_active: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get category by ID (for admin detail/update)
   */
  async findById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  /**
   * Get category by slug with SMART response:
   * - If has children (subcategories) → return type='subcategories' + categories list
   * - If no children → return type='products' + products paginated (default approach via products endpoint)
   * Used for hierarchical category navigation
   */
  async findBySlug(slug: string): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: { slug, is_active: true },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    // Smart endpoint logic: if has children → return subcategories, else → suggest products endpoint
    if (category.children && category.children.length > 0) {
      return {
        type: 'subcategories',
        id: category.id,
        name: category.name,
        slug: category.slug,
        level: category.level,
        categories: category.children,
      };
    } else {
      return {
        type: 'products',
        id: category.id,
        name: category.name,
        slug: category.slug,
        level: category.level,
        message: 'Use GET /category/:slug/products for paginated product list',
      };
    }
  }

  async findProductsBySlug(
    slug: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: { slug, is_active: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    const countResult = await this.medicineRepository
      .createQueryBuilder('m')
      .select('COUNT(DISTINCT m.id)', 'total')
      .innerJoin('product_categories', 'pc', 'm.id = pc.product_id')
      .where('pc.category_id = :categoryId', { categoryId: category.id })
      .andWhere('m.is_active = :active', { active: true })
      .getRawOne();

    const total = parseInt(countResult?.total || '0', 10);

    const paginatedProducts = await this.medicineRepository
      .createQueryBuilder('m')
      .select(['m.id', 'm.name', 'm.slug', 'm.image_url'])
      .innerJoin('product_categories', 'pc', 'm.id = pc.product_id')
      .where('pc.category_id = :categoryId', { categoryId: category.id })
      .andWhere('m.is_active = :active', { active: true })
      .orderBy('m.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    if (paginatedProducts.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const productIds = paginatedProducts.map(p => p.id);
    const pricesData = await this.medicineRepository
      .createQueryBuilder('m')
      .select([
        'm.id as id',
        'mp.price as price',
        'mu.name as measure_unit_name',
        'mp.is_sell_default as is_sell_default',
      ])
      .leftJoin(
        'product_prices',
        'mp',
        'm.id = mp.product_id AND mp.is_sell_default = true',
      )
      .leftJoin('measure_units', 'mu', 'mp.measure_unit_id = mu.id')
      .where('m.id IN (:...productIds)', { productIds })
      .getRawMany();

    // Merge: Combine product info with pricing data
    const products = paginatedProducts.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image_url: product.image_url,
      ...pricesData.find(p => p.id === product.id),
    }));

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get category info with product count
   * Returns basic category details for metadata purposes
   */
  async getCategoryInfo(slug: string): Promise<{
    id: number;
    name: string;
    slug: string;
    level: number;
    product_count: number;
  }> {
    const category = await this.categoryRepository.findOne({
      where: { slug, is_active: true },
      relations: ['product_links'],
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      level: category.level,
      product_count: (category.product_links || []).length,
    };
  }
}
