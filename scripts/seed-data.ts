import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, EntityManager } from 'typeorm';
import { Category } from '../src/modules/category/entities/category.entity';
import { ProductCategory } from '../src/modules/category/entities/product-category.entity';
import { Medicine, ProductType } from '../src/modules/medicine/entities/medicine.entity';
import { MedicinePrice } from '../src/modules/medicine/entities/medicine-price.entity';
import { MeasureUnit } from '../src/modules/medicine/entities/measure-unit.entity';
import { toSlug } from '../src/common/utils/slug';

dotenv.config();

interface PriceData {
  measureUnitName?: string;
  price?: number | null;
  isSellDefault?: boolean;
}

interface ProductData {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  prices?: PriceData[];
  categories?: string[];
  usage?: string;
  dosage?: string;
  adverseEffect?: string;
  careful?: string;
  preservation?: string;
}

interface SourceProduct {
  sourceFolder: string;
  productType: ProductType;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  usage: string | null;
  dosage: string | null;
  adverse_effect: string | null;
  careful: string | null;
  preservation: string | null;
  prices: Array<{
    measureUnitName: string;
    price: number;
    isSellDefault: boolean;
  }>;
  categories: string[];
}

interface CategorySeed {
  name: string;
  slug: string;
  level: number;
  parentSlug: string | null;
}

const args = new Set(process.argv.slice(2));
const validateOnly = args.has('--validate-only');
const dryRun = args.has('--dry-run') || process.env.SEED_DRY_RUN === 'true';

function cleanText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function dataFolders() {
  return [
    {
      folder: 'thuoc',
      productType: ProductType.DRUG,
      dir: path.join(__dirname, '..', 'data', 'data_clean', 'thuoc'),
    },
    {
      folder: 'thuc-pham-chuc-nang',
      productType: ProductType.SUPPLEMENT,
      dir: path.join(
        __dirname,
        '..',
        'data',
        'data_clean',
        'thuc-pham-chuc-nang',
      ),
    },
  ];
}

function uniqueSlug(baseSlug: string, usedSlugs: Set<string>): string {
  let slug = baseSlug || 'san-pham';
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  usedSlugs.add(slug);
  return slug;
}

function slugFromDataClean(rawSlug?: string | null): string {
  const trimmed = cleanText(rawSlug);
  if (!trimmed) {
    return '';
  }

  const lastSegment = trimmed.includes('/')
    ? trimmed.slice(trimmed.lastIndexOf('/') + 1)
    : trimmed;

  return lastSegment.replace(/\.html$/i, '').trim();
}

function selectProductCategories(categories?: string[]): string[] {
  const cleaned = (categories || [])
    .map((category) => category.trim())
    .filter(Boolean);

  const [root, second, third] = cleaned;
  if (
    toSlug(root) === 'thuc-pham-chuc-nang' &&
    toSlug(second) === 'co-xuong-khop' &&
    third
  ) {
    return [root, third];
  }

  return cleaned.slice(0, 2);
}

function readProducts(): SourceProduct[] {
  const products: SourceProduct[] = [];
  const usedProductNames = new Set<string>();
  const usedSlugs = new Set<string>();

  for (const source of dataFolders()) {
    if (!fs.existsSync(source.dir)) {
      continue;
    }

    const files = fs
      .readdirSync(source.dir)
      .filter((file) => file.endsWith('_clean.json'))
      .sort();

    for (const file of files) {
      const filePath = path.join(source.dir, file);
      const items = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ProductData[];

      for (const item of items) {
        const name = cleanText(item.name);
        if (!name || usedProductNames.has(name)) {
          continue;
        }

        usedProductNames.add(name);

        const categories = selectProductCategories(item.categories);

        const prices = (item.prices || [])
          .filter((price) => cleanText(price.measureUnitName))
          .map((price) => ({
            measureUnitName: price.measureUnitName!.trim(),
            price: price.price ?? -1,
            isSellDefault: Boolean(price.isSellDefault),
          }));

        products.push({
          sourceFolder: source.folder,
          productType: source.productType,
          name,
          slug: uniqueSlug(slugFromDataClean(item.slug) || toSlug(name), usedSlugs),
          description: cleanText(item.description),
          image_url: cleanText(item.image),
          usage: cleanText(item.usage),
          dosage: cleanText(item.dosage),
          adverse_effect: cleanText(item.adverseEffect),
          careful: cleanText(item.careful),
          preservation: cleanText(item.preservation),
          prices,
          categories,
        });
      }
    }
  }

  return products;
}

function buildCategorySeeds(products: SourceProduct[]): CategorySeed[] {
  const categories = new Map<string, CategorySeed>();

  for (const product of products) {
    const [rootName, childName] = product.categories;

    if (rootName) {
      const rootSlug = toSlug(rootName);
      categories.set(rootSlug, {
        name: rootName,
        slug: rootSlug,
        level: 1,
        parentSlug: null,
      });

      if (childName) {
        const childSlug = toSlug(childName);
        categories.set(childSlug, {
          name: childName,
          slug: childSlug,
          level: 2,
          parentSlug: rootSlug,
        });
      }
    }
  }

  return Array.from(categories.values()).sort((a, b) => a.level - b.level);
}

function buildDataSource() {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Medicine, MedicinePrice, MeasureUnit, Category, ProductCategory],
    synchronize: false,
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : undefined,
  });
}

async function seedMeasureUnits(
  manager: EntityManager,
  products: SourceProduct[],
) {
  const repo = manager.getRepository(MeasureUnit);
  const existing = await repo.find();
  const existingNames = new Set(existing.map((unit) => unit.name));
  const unitNames = Array.from(
    new Set(
      products.flatMap((product) =>
        product.prices.map((price) => price.measureUnitName),
      ),
    ),
  ).sort();

  const toInsert = unitNames
    .filter((name) => !existingNames.has(name))
    .map((name) => repo.create({ name }));

  if (toInsert.length > 0) {
    await repo.save(toInsert, { chunk: 200 });
  }

  const allUnits = await repo.find();
  return {
    inserted: toInsert.length,
    units: new Map(allUnits.map((unit) => [unit.name, unit])),
  };
}

async function seedCategories(
  manager: EntityManager,
  categorySeeds: CategorySeed[],
) {
  const repo = manager.getRepository(Category);
  const existing = await repo.find({ relations: ['parent'] });
  const categoryMap = new Map(existing.map((category) => [category.slug, category]));
  const categoryByName = new Map(
    existing.map((category) => [category.name.trim().toLowerCase(), category]),
  );
  let inserted = 0;
  let updatedSlugs = 0;

  for (const seed of categorySeeds) {
    if (categoryMap.has(seed.slug)) {
      continue;
    }

    const existingByName = categoryByName.get(seed.name.trim().toLowerCase());
    if (existingByName) {
      categoryMap.delete(existingByName.slug);
      existingByName.slug = seed.slug;
      existingByName.level = seed.level;
      existingByName.parent = (seed.parentSlug
        ? categoryMap.get(seed.parentSlug)
        : null) as Category;
      existingByName.is_active = true;

      const saved = await repo.save(existingByName);
      categoryMap.set(saved.slug, saved);
      categoryByName.set(saved.name.trim().toLowerCase(), saved);
      updatedSlugs++;
      continue;
    }

    const category = repo.create({
      name: seed.name,
      slug: seed.slug,
      level: seed.level,
      parent: seed.parentSlug ? categoryMap.get(seed.parentSlug) : undefined,
      is_active: true,
    });

    const saved = await repo.save(category);
    categoryMap.set(saved.slug, saved);
    categoryByName.set(saved.name.trim().toLowerCase(), saved);
    inserted++;
  }

  return { inserted, updatedSlugs, categories: categoryMap };
}

async function seedProducts(
  manager: EntityManager,
  products: SourceProduct[],
  measureUnits: Map<string, MeasureUnit>,
  categories: Map<string, Category>,
) {
  const productRepo = manager.getRepository(Medicine);
  const priceRepo = manager.getRepository(MedicinePrice);
  const productCategoryRepo = manager.getRepository(ProductCategory);
  const existingProducts = await productRepo.find();
  const productByName = new Map(
    existingProducts.map((product) => [product.name, product]),
  );
  const existingSlugs = new Set(existingProducts.map((product) => product.slug));
  let insertedProducts = 0;
  let updatedProductSlugs = 0;
  let insertedPrices = 0;
  let insertedCategoryLinks = 0;
  let missingUnits = 0;
  let missingCategories = 0;

  for (const sourceProduct of products) {
    let product = productByName.get(sourceProduct.name);

    if (product) {
      if (product.slug !== sourceProduct.slug) {
        existingSlugs.delete(product.slug);
        product.slug = uniqueSlug(sourceProduct.slug, existingSlugs);
        product = await productRepo.save(product);
        productByName.set(product.name, product);
        updatedProductSlugs++;
      }
    } else {
      const slug = uniqueSlug(sourceProduct.slug, existingSlugs);
      product = productRepo.create({
        name: sourceProduct.name,
        slug,
        description: sourceProduct.description,
        image_url: sourceProduct.image_url,
        product_type: sourceProduct.productType,
        is_active: true,
        usage: sourceProduct.usage,
        dosage: sourceProduct.dosage,
        adverse_effect: sourceProduct.adverse_effect,
        careful: sourceProduct.careful,
        preservation: sourceProduct.preservation,
      });

      product = await productRepo.save(product);
      productByName.set(product.name, product);
      insertedProducts++;
    }

    for (const price of sourceProduct.prices) {
      const measureUnit = measureUnits.get(price.measureUnitName);
      if (!measureUnit) {
        missingUnits++;
        continue;
      }

      const existingPrice = await priceRepo.findOne({
        where: {
          product: { id: product.id },
          measure_unit: { id: measureUnit.id },
        },
      });

      if (existingPrice) {
        continue;
      }

      await priceRepo.save(
        priceRepo.create({
          product,
          measure_unit: measureUnit,
          price: price.price,
          is_sell_default: price.isSellDefault,
        }),
      );
      insertedPrices++;
    }

    for (let index = 0; index < sourceProduct.categories.length; index++) {
      const categorySlug = toSlug(sourceProduct.categories[index]);
      const category = categories.get(categorySlug);

      if (!category) {
        missingCategories++;
        continue;
      }

      const existingLink = await productCategoryRepo.findOne({
        where: {
          product_id: product.id,
          category_id: category.id,
        },
      });

      if (existingLink) {
        continue;
      }

      await productCategoryRepo.save(
        productCategoryRepo.create({
          product_id: product.id,
          category_id: category.id,
          is_primary: index === 0,
        }),
      );
      insertedCategoryLinks++;
    }
  }

  return {
    insertedProducts,
    updatedProductSlugs,
    insertedPrices,
    insertedCategoryLinks,
    missingUnits,
    missingCategories,
  };
}

async function main() {
  const products = readProducts();
  const categorySeeds = buildCategorySeeds(products);
  const unitCount = new Set(
    products.flatMap((product) =>
      product.prices.map((price) => price.measureUnitName),
    ),
  ).size;

  console.log(`Products loaded: ${products.length}`);
  console.log(`Measure units found: ${unitCount}`);
  console.log(`Categories found: ${categorySeeds.length}`);
  console.log(`Sample name slug fallback: ${toSlug('điều trị ê buốt')}`);
  console.log(
    `Sample data_clean slug: ${slugFromDataClean(
      'thuoc/xuong-khop-truong-phuc-2x10-36054.html',
    )}`,
  );

  if (validateOnly) {
    console.log('Validate-only completed. No database connection was opened.');
    return;
  }

  const dataSource = buildDataSource();
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const measureUnitResult = await seedMeasureUnits(queryRunner.manager, products);
    const categoryResult = await seedCategories(queryRunner.manager, categorySeeds);
    const productResult = await seedProducts(
      queryRunner.manager,
      products,
      measureUnitResult.units,
      categoryResult.categories,
    );

    console.log(`Measure units inserted: ${measureUnitResult.inserted}`);
    console.log(`Categories inserted: ${categoryResult.inserted}`);
    console.log(`Category slugs updated: ${categoryResult.updatedSlugs}`);
    console.log(`Products inserted: ${productResult.insertedProducts}`);
    console.log(`Product slugs updated: ${productResult.updatedProductSlugs}`);
    console.log(`Prices inserted: ${productResult.insertedPrices}`);
    console.log(`Category links inserted: ${productResult.insertedCategoryLinks}`);
    console.log(`Missing measure unit references: ${productResult.missingUnits}`);
    console.log(`Missing category references: ${productResult.missingCategories}`);

    if (dryRun) {
      await queryRunner.rollbackTransaction();
      console.log('Dry-run completed. Transaction rolled back.');
    } else {
      await queryRunner.commitTransaction();
      console.log('Seed completed and committed.');
    }
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
