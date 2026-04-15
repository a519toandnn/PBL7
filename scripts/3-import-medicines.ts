/**
 * SCRIPT 3: IMPORT MEDICINES (PRODUCTS + RELATIONSHIPS)
 * 
 * Purpose: Import all medicines from JSON files
 *          Create M:N relationships with measure_units and categories
 *          Preserve medical information
 * 
 * Prerequisites:
 *  - Script 1 must run first: measure_units table populated
 *  - Script 2 must run first: categories table with hierarchy
 * 
 * Run: npm run seed:medicines
 * 
 * Process:
 * 1. Read all JSON files from data_clean/thuoc/
 * 2. For each product:
 *    - Extract basic info (name, slug, description)
 *    - Extract medical info (indications, usage, warnings, etc.)
 *    - For each price → lookup measure_unit → insert product_price
 *    - For each category → lookup category_id → insert product_category
 * 3. Log progress and final count
 */

import * as fs from 'fs';
import * as path from 'path';
import { createConnection, In, getRepository } from 'typeorm';
import { Medicine, ProductType } from '../src/modules/medicine/entities/medicine.entity';
import { MedicinePrice } from '../src/modules/medicine/entities/medicine-price.entity';
import { ProductCategory } from '../src/modules/category/entities/product-category.entity';
import { MeasureUnit } from '../src/modules/medicine/entities/measure-unit.entity';
import { Category } from '../src/modules/category/entities/category.entity';
import { toSlug } from '../src/common/utils/slug';
import * as dotenv from 'dotenv';

dotenv.config();

interface PriceData {
  measureUnitName: string;
  price: number;
  isSellDefault: boolean;
}

interface MedicineData {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  prices: PriceData[];
  categories: string[];
  usage?: string;
  dosage?: string;
  adverseEffect?: string;
  careful?: string;
  preservation?: string;
}

interface ProcessedProduct {
  name: string;
  slug: string;
  description: string;
  image?: string;
  folder: string;  // Thêm folder để track source
  medical_info: {
    usage?: string;
    dosage?: string;
    adverse_effect?: string;
    careful?: string;
    preservation?: string;
  };
  prices: Array<{
    measureUnitName: string;
    price: number;
    isSellDefault: boolean;
  }>;
  categories: string[];
}

async function importMedicines() {
  console.log('🚀 Starting Medicines import...\n');

  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [path.join(__dirname, '../src/**/*.entity.{ts,js}')],
    });
    const medicineRepo = connection.getRepository(Medicine);
    const medicinePriceRepo = connection.getRepository(MedicinePrice);
    const productCategoryRepo = connection.getRepository(ProductCategory);
    const measureUnitRepo = connection.getRepository(MeasureUnit);
    const categoryRepo = connection.getRepository(Category);

    console.log('✅ Database connected\n');

    // Step 1: Extract all JSON files from data/data_clean/
    const folders = ['thuoc', 'thuc-pham-chuc-nang'];
    const allFiles: { folder: string; file: string }[] = [];

    for (const folder of folders) {
      const dataDir = path.join(__dirname, `../data/data_clean/${folder}`);
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('_clean.json'));
        for (const file of files) {
          allFiles.push({ folder, file });
        }
      }
    }
    console.log(`📂 Found ${allFiles.length} JSON files from ${folders.length} folders\n`);

    // Step 2: Load measure units and categories from DB
    console.log('📦 Loading existing measure units and categories...\n');

    const measureUnits = await measureUnitRepo.find();
    const measureUnitMap = new Map<string, any>();
    measureUnits.forEach((unit) => {
      measureUnitMap.set(unit.name, unit);
    });
    console.log(`   Found ${measureUnits.length} measure units\n`);

    const categories = await categoryRepo.find();
    const categoryMap = new Map<string, any>();
    categories.forEach((cat) => {
      categoryMap.set(cat.slug, cat);
    });
    console.log(`   Found ${categories.length} categories\n`);

    // Step 3: Extract all products from JSON
    console.log('📊 Scanning JSON files for products...\n');

    const products: ProcessedProduct[] = [];
    let totalScanned = 0;

    for (const { folder, file } of allFiles) {
      const dataDir = path.join(__dirname, `../data/data_clean/${folder}`);
      const filePath = path.join(dataDir, file);
      const fileData: MedicineData[] = JSON.parse(
        fs.readFileSync(filePath, 'utf-8'),
      );

      for (const item of fileData) {
        const productSlug = toSlug(item.name);
        const prices: Array<{
          measureUnitName: string;
          price: number;
          isSellDefault: boolean;
        }> = [];

        // Extract prices
        if (item.prices && Array.isArray(item.prices)) {
          for (const priceGroup of item.prices) {
            if (priceGroup.measureUnitName) {
              prices.push({
                measureUnitName: priceGroup.measureUnitName,
                price: priceGroup.price ?? -1,  // If null/undefined, use -1
                isSellDefault: priceGroup.isSellDefault || false,
              });
            }
          }
        }

        // Take only first 2 categories
        const productCategories = (item.categories || []).slice(0, 2);

        const product: ProcessedProduct = {
          name: item.name,
          slug: productSlug,
          description: item.description || '',
          image: item.image,
          folder,  // Track which folder this came from
          medical_info: {
            usage: item.usage,
            dosage: item.dosage,
            adverse_effect: item.adverseEffect,
            careful: item.careful,
            preservation: item.preservation,
          },
          prices,
          categories: productCategories,
        };

        products.push(product);
        totalScanned++;
      }
    }

    console.log(`   Scanned ${totalScanned} products\n`);

    // Step 4: Insert products
    console.log('⚙️  Importing medicines...\n');

    let successCount = 0;
    let errorCount = 0;
    const importedMedicines = new Map<string, Medicine>();

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        // Check if already exists
        let medicine = await medicineRepo.findOne({
          where: { name: product.name },
        });

        if (medicine) {
          console.log(`   ⏭️  Skip (exists): "${product.name}"`);
          importedMedicines.set(product.slug, medicine);
          continue;
        }

        // Determine product_type based on folder
        let productType = ProductType.OTHER;
        if (product.folder === 'thuoc') {
          productType = ProductType.DRUG;
        } else if (product.folder === 'thuc-pham-chuc-nang') {
          productType = ProductType.SUPPLEMENT;
        }

        // Create medicine with medical info denormalized
        medicine = medicineRepo.create({
          name: product.name,
          slug: product.slug,
          description: product.description,
          image_url: product.image,
          product_type: productType,
          is_active: true,
          usage: product.medical_info.usage,
          dosage: product.medical_info.dosage,
          adverse_effect: product.medical_info.adverse_effect,
          careful: product.medical_info.careful,
          preservation: product.medical_info.preservation,
        });

        medicine = await medicineRepo.save(medicine);
        importedMedicines.set(product.slug, medicine);

        // Create prices
        for (const price of product.prices) {
          const measureUnit = measureUnitMap.get(price.measureUnitName);

          if (!measureUnit) {
            console.warn(
              `   ⚠️  Measure unit not found: "${price.measureUnitName}"`,
            );
            continue;
          }

          const medicinePrice = medicinePriceRepo.create({
            product: medicine,
            measure_unit: measureUnit,
            price: price.price,
            is_sell_default: price.isSellDefault,
          });

          await medicinePriceRepo.save(medicinePrice);
        }

        // Create categories
        for (const categoryName of product.categories) {
          const categorySlug = toSlug(categoryName);
          const category = categoryMap.get(categorySlug);

          if (!category) {
            console.warn(
              `   ⚠️  Category slug not found: "${categorySlug}" (${categoryName})`,
            );
            continue;
          }

          const productCategory = productCategoryRepo.create({
            product: medicine,
            category: category,
            is_primary: product.categories.indexOf(categoryName) === 0,
          });

          await productCategoryRepo.save(productCategory);
        }

        successCount++;

        if ((i + 1) % 100 === 0 || i === products.length - 1) {
          console.log(
            `   ${i + 1}/${products.length} - ✅ Imported: "${product.name}" (ID: ${medicine.id})`,
          );
        }
      } catch (error: unknown) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error importing "${product.name}":`, errorMsg);
      }
    }

    // Step 5: Verify
    console.log('\n📈 Verification...\n');

    const totalMedicines = await medicineRepo.count();
    const totalPrices = await medicinePriceRepo.count();
    const totalProductCategories = await productCategoryRepo.count();

    console.log(`📊 Import Summary:`);
    console.log(`   ✅ Total medicines: ${totalMedicines}`);
    console.log(`   ✅ Total prices: ${totalPrices}`);
    console.log(`   ✅ Total categories linked: ${totalProductCategories}`);
    console.log(`   ✅ Successfully imported: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}\n`);

    // Step 6: Check relationships
    console.log('📋 Sample medicines with relationships:\n');

    const sampleMedicines = await medicineRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.prices', 'mp')
      .leftJoinAndSelect('mp.measure_unit', 'mu')
      .leftJoinAndSelect('m.category_links', 'pc')
      .leftJoinAndSelect('pc.category', 'c')
      .take(3)
      .getMany();

    for (const medicine of sampleMedicines) {
      console.log(`📦 ${medicine.name}`);
      console.log(`   Prices: ${medicine.prices?.length || 0}`);
      if (medicine.prices && medicine.prices.length > 0) {
        medicine.prices.forEach((p) => {
          console.log(
            `     - ${p.price} VND / ${p.measure_unit?.name || 'N/A'}`,
          );
        });
      }
      console.log(
        `   Categories: ${medicine.category_links?.length || 0}`,
      );
      if (medicine.category_links && medicine.category_links.length > 0) {
        medicine.category_links.forEach((pc) => {
          console.log(`     - ${pc.category?.name || 'N/A'}`);
        });
      }
      const hasMedicalInfo = medicine.usage || medicine.dosage || medicine.adverse_effect || medicine.careful || medicine.preservation;
      console.log(`   Medical Info: ${hasMedicalInfo ? '✅' : '❌'}`);
      console.log('');
    }

    await connection.close();

    console.log('✨ Medicine import completed successfully!');
    console.log(
      '\n💡 Next steps:',
    );
    console.log(
      '   1. Verify data in DB: SELECT COUNT(*) FROM products;',
    );
    console.log(
      '   2. Test API: http://localhost:3000/medicines?page=1',
    );
    console.log(
      '   3. Test detail: http://localhost:3000/medicines/[slug]',
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
}

importMedicines();
