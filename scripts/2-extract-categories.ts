/**
 * SCRIPT 2: EXTRACT & SEED CATEGORIES
 * 
 * Purpose: Extract first 2 categories from JSON files
 *          Build category hierarchy (parent-child relationships)
 *          Insert into categories table
 * 
 * Run: npm run seed:categories
 * 
 * Logic:
 * - JSON has 3 categories per product, we take first 2
 * - Usually: [root level, sub-category]
 * - Find/create root category (level 1)
 * - Find/create sub-categories with parent_id (level 2)
 */

import * as fs from 'fs';
import * as path from 'path';
import { createConnection } from 'typeorm';
import { Category } from '../src/modules/category/entities/category.entity';
import { toSlug } from '../src/common/utils/slug';
import * as dotenv from 'dotenv';

dotenv.config();

interface MedicineData {
  categories: string[];
}

interface CategoryHierarchy {
  name: string;
  slug: string;
  parent: string | null;
  level: number;
}

async function extractAndSeedCategories() {
  console.log('🚀 Starting Categories extraction and seeding...\n');

  try {
    // Initialize TypeORM connection
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [path.join(__dirname, '../src/**/*.entity.{ts,js}')],
    });
    const categoryRepository = connection.getRepository(Category);

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

    // Step 2: Extract categories hierarchy
    const categoryMap = new Map<string, CategoryHierarchy>();
    let totalProcessed = 0;

    console.log('📊 Scanning for categories...\n');

    for (const { folder, file } of allFiles) {
      const dataDir = path.join(__dirname, `../data/data_clean/${folder}`);
      const filePath = path.join(dataDir, file);
      const fileData: MedicineData[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      for (const item of fileData) {
        if (item.categories && Array.isArray(item.categories)) {
          // Take only first 2 categories
          const firstTwo = item.categories.slice(0, 2);

          // First category = root (level 1, no parent)
          if (firstTwo[0]) {
            const root = firstTwo[0].trim();
            const rootSlug = toSlug(root);
            if (!categoryMap.has(rootSlug)) {
              categoryMap.set(rootSlug, {
                name: root,
                slug: rootSlug,
                parent: null,
                level: 1,
              });
              console.log(`   ✅ Found root: "${root}"`);
            }
          }

          // Second category = sub-category (level 2, parent is first)
          if (firstTwo[1]) {
            const sub = firstTwo[1].trim();
            const subSlug = toSlug(sub);
            const parentSlug = toSlug(firstTwo[0]?.trim() || '');

            if (!categoryMap.has(subSlug)) {
              categoryMap.set(subSlug, {
                name: sub,
                slug: subSlug,
                parent: firstTwo[0]?.trim() || null,
                level: 2,
              });
              console.log(`   ✅ Found sub: "${sub}" → parent: "${firstTwo[0]}"`);
            }
          }

          totalProcessed++;
        }
      }
    }

    console.log(`\n📈 Processed ${totalProcessed} products`);
    console.log(`📌 Found ${categoryMap.size} unique categories\n`);

    // Step 3: Display category tree
    console.log('📋 Category hierarchy:\n');

    // Get all root categories
    const roots = Array.from(categoryMap.values())
      .filter((c) => c.level === 1)
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const root of roots) {
      console.log(`📂 ${root.name}`);

      // Get children of this root
      const children = Array.from(categoryMap.values())
        .filter((c) => c.parent === root.name && c.level === 2)
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const child of children) {
        console.log(`   └─ ${child.name}`);
      }
    }

    // Step 4: Check existing categories
    console.log(`\n📦 Checking existing categories in DB...\n`);
    const existingCategories = await categoryRepository.find();
    const existingMap = new Map<string, Category>();
    existingCategories.forEach((cat) => {
      existingMap.set(cat.slug, cat);
    });
    console.log(`   Already in DB: ${existingCategories.length} categories\n`);

    // Step 5: Insert categories
    console.log('⚙️  Seeding categories...\n');

    const insertedCategories = new Map<string, Category>();

    // First pass: Insert all level 1 categories
    for (const cat of categoryMap.values()) {
      if (cat.level === 1) {
        if (existingMap.has(cat.slug)) {
          console.log(`   ⏭️  Skip (exists): "${cat.name}"`);
          insertedCategories.set(cat.slug, existingMap.get(cat.slug)!);
        } else {
          try {
            const category = categoryRepository.create({
              name: cat.name,
              slug: cat.slug,
              level: 1,
              is_active: true,
            });
            const saved = await categoryRepository.save(category);
            insertedCategories.set(cat.slug, saved as Category);
            console.log(`   ✅ Inserted root: "${cat.name}"`);
          } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`   ❌ Failed to insert "${cat.name}":`, errorMsg);
          }
        }
      }
    }

    console.log('');

    // Second pass: Insert all level 2 categories with parent_id
    for (const cat of categoryMap.values()) {
      if (cat.level === 2) {
        if (existingMap.has(cat.slug)) {
          console.log(`   ⏭️  Skip (exists): "${cat.name}"`);
          insertedCategories.set(cat.slug, existingMap.get(cat.slug)!);
        } else {
          try {
            // Find parent
            const parentSlug = toSlug(cat.parent || '');
            const parent = insertedCategories.get(parentSlug);

            if (!parent) {
              console.error(
                `   ❌ Cannot find parent "${cat.parent}" for "${cat.name}"`,
              );
              continue;
            }

            const category = categoryRepository.create({
              name: cat.name,
              slug: cat.slug,
              level: 2,
              parent: parent,
              is_active: true,
            });
            const saved = await categoryRepository.save(category);
            insertedCategories.set(cat.slug, saved as Category);
            console.log(
              `   ✅ Inserted sub: "${cat.name}" (parent_id: ${parent.id})`,
            );
          } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`   ❌ Failed to insert "${cat.name}":`, errorMsg);
          }
        }
      }
    }

    // Step 6: Verify
    console.log('\n📈 Verification...\n');
    const finalCategories = await categoryRepository.find({ relations: ['parent'] });
    console.log(`Total categories now: ${finalCategories.length}\n`);

    console.log('📋 Final category tree:\n');
    const finalRoots = finalCategories.filter((c) => !c.parent);

    for (const root of finalRoots.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`📂 ${root.name} (level: ${root.level})`);

      const children = finalCategories
        .filter((c) => c.parent?.id === root.id)
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const child of children) {
        console.log(`   └─ ${child.name} (level: ${child.level})`);
      }
    }

    await connection.close();
    console.log('\n✨ Category seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

extractAndSeedCategories();
