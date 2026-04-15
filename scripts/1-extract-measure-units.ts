/**
 * SCRIPT 1: EXTRACT & SEED MEASURE UNITS
 * 
 * Purpose: Extract all unique measureUnitName from JSON files
 *          and insert them into measure_units table
 * 
 * Run: npm run seed:units
 */

import * as fs from 'fs';
import * as path from 'path';
import { createConnection } from 'typeorm';
import { MeasureUnit } from '../src/modules/medicine/entities/measure-unit.entity';
import { toSlug } from '../src/common/utils/slug';
import * as dotenv from 'dotenv';

dotenv.config();

interface PriceItem {
  measureUnitName: string;
  price: number;
  isSellDefault: boolean;
}

interface MedicineData {
  name: string;
  prices: PriceItem[];
  categories: string[];
  usage: string;
  dosage: string;
  adverseEffect: string;
  careful: string;
  preservation: string;
}

async function extractAndSeedMeasureUnits() {
  console.log('🚀 Starting MeasureUnits extraction and seeding...\n');

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
    const measureUnitRepository = connection.getRepository(MeasureUnit);

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

    // Step 2: Extract unique measure unit names
    const measureUnitSet = new Set<string>();
    let totalProcessed = 0;

    for (const { folder, file } of allFiles) {
      const dataDir = path.join(__dirname, `../data/data_clean/${folder}`);
      const filePath = path.join(dataDir, file);
      const fileData: MedicineData[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      for (const item of fileData) {
        if (item.prices && Array.isArray(item.prices)) {
          for (const price of item.prices) {
            if (price.measureUnitName) {
              measureUnitSet.add(price.measureUnitName.trim());
              totalProcessed++;
            }
          }
        }
      }
    }

    const uniqueUnits = Array.from(measureUnitSet).sort();
    console.log(`📊 Extracted ${totalProcessed} total prices`);
    console.log(`📌 Found ${uniqueUnits.length} unique measure units:\n`);

    uniqueUnits.forEach((unit, idx) => {
      console.log(`   ${idx + 1}. "${unit}"`);
    });

    // Step 3: Check existing units
    const existingUnits = await measureUnitRepository.find();
    console.log(`\n📦 Existing measure units in DB: ${existingUnits.length}`);

    if (existingUnits.length > 0) {
      console.log('   Existing units:');
      existingUnits.forEach((unit) => {
        console.log(`   - ${unit.name}`);
      });
    }

    // Step 4: Insert new units
    const existingUnitNames = new Set(existingUnits.map((u) => u.name));
    const unitsToInsert = uniqueUnits.filter((u) => !existingUnitNames.has(u));

    console.log(`\n⚙️  Units to insert: ${unitsToInsert.length}\n`);

    let insertedCount = 0;
    for (const unitName of unitsToInsert) {
      try {
        const unit = measureUnitRepository.create({
          name: unitName,
        });
        await measureUnitRepository.save(unit);
        console.log(`   ✅ Inserted: "${unitName}"`);
        insertedCount++;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed to insert "${unitName}":`, errorMsg);
      }
    }

    console.log(`\n✅ Successfully inserted ${insertedCount} measure units\n`);

    // Step 5: Verify
    const finalUnits = await measureUnitRepository.find();
    console.log(`📈 Total measure units now: ${finalUnits.length}`);
    console.log('Final list:');
    finalUnits.forEach((unit) => {
      console.log(`   - ${unit.id}: ${unit.name}`);
    });

    await connection.close();
    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

extractAndSeedMeasureUnits();
