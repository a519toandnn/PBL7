import 'dotenv/config';
import { createHash } from 'crypto';
import AppDataSource from '../src/configs/typeorm.datasource';
import { Medicine } from '../src/modules/medicine/entities/medicine.entity';
import { buildMedicineSearchTextFromName } from '../src/modules/medicine/utils/build-medicine-search-text';

const GEMINI_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001';
const GEMINI_DIMENSIONS =
  Number(process.env.GEMINI_EMBEDDING_DIMENSIONS) || 768;
const BATCH_SIZE = Number(process.env.GEMINI_BACKFILL_BATCH_SIZE) || 50;
const DELAY_MS = Number(process.env.GEMINI_BACKFILL_DELAY_MS) || 1000;
const MAX_RETRIES = Number(process.env.GEMINI_BACKFILL_MAX_RETRIES) || 5;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedBatch(
  items: Array<{ title: string; text: string }>,
): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  let response: Response;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:batchEmbedContents`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: items.map((item) => ({
            model: `models/${GEMINI_MODEL}`,
            content: {
              parts: [{ text: item.text }],
            },
            taskType: 'RETRIEVAL_DOCUMENT',
            title: item.title,
            outputDimensionality: GEMINI_DIMENSIONS,
          })),
        }),
      },
    );

    if (response.status !== 429 || attempt === MAX_RETRIES) {
      break;
    }

    const errorText = await response.text().catch(() => '');
    const retryDelayMs = getRetryDelayMs(errorText, attempt);
    console.warn(
      `Gemini quota hit. Waiting ${Math.ceil(retryDelayMs / 1000)}s before retry ${attempt + 1}/${MAX_RETRIES}`,
    );
    await sleep(retryDelayMs);
  }

  if (!response!.ok) {
    const errorText = await response!.text().catch(() => '');
    throw new Error(
      `Gemini batch embedding failed: ${response!.status} ${errorText}`,
    );
  }

  const result = await response!.json();
  const embeddings = result.embeddings?.map(
    (embedding: { values: number[] }) => embedding.values,
  );

  if (!Array.isArray(embeddings)) {
    throw new Error('Gemini batch embedding response invalid');
  }

  for (const embedding of embeddings) {
    if (embedding.length !== GEMINI_DIMENSIONS) {
      throw new Error(`Unexpected embedding dimension: ${embedding.length}`);
    }
  }

  return embeddings;
}

function getRetryDelayMs(errorText: string, attempt: number): number {
  const retryDelaySeconds = errorText.match(/"retryDelay"\s*:\s*"(\d+)s"/);
  if (retryDelaySeconds?.[1]) {
    return (Number(retryDelaySeconds[1]) + 5) * 1000;
  }

  const messageDelaySeconds = errorText.match(/Please retry in ([\d.]+)s/);
  if (messageDelaySeconds?.[1]) {
    return Math.ceil(Number(messageDelaySeconds[1]) + 5) * 1000;
  }

  return Math.min(60_000, 5_000 * 2 ** attempt);
}

async function main(): Promise<void> {
  await AppDataSource.initialize();

  const products = await AppDataSource.getRepository(Medicine).find({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    where: {
      is_active: true,
    },
    order: {
      id: 'ASC',
    },
  });

  for (let index = 0; index < products.length; index += BATCH_SIZE) {
    const batch = products.slice(index, index + BATCH_SIZE);
    const docs = batch.map((product) => {
      const text = buildMedicineSearchTextFromName(product.name);

      return {
        product,
        title: product.name,
        text,
        hash: createHash('sha256').update(text).digest('hex'),
      };
    });

    const existingRows = await AppDataSource.query(
      `
        SELECT product_id, search_text_hash
        FROM product_search_embeddings
        WHERE product_id = ANY($1::int[])
      `,
      [docs.map((doc) => doc.product.id)],
    );
    const existingHashByProductId = new Map<number, string>(
      existingRows.map((row: { product_id: number; search_text_hash: string }) => [
        Number(row.product_id),
        row.search_text_hash,
      ]),
    );
    const docsToIndex = docs.filter(
      (doc) => existingHashByProductId.get(doc.product.id) !== doc.hash,
    );

    if (docsToIndex.length === 0) {
      console.log(
        `Skipped ${Math.min(index + BATCH_SIZE, products.length)}/${products.length}`,
      );
      continue;
    }

    const embeddings = await embedBatch(
      docsToIndex.map((doc) => ({ title: doc.title, text: doc.text })),
    );

    for (let i = 0; i < docsToIndex.length; i++) {
      const doc = docsToIndex[i];
      const embedding = embeddings[i];
      const vectorLiteral = `[${embedding.join(',')}]`;

      await AppDataSource.query(
        `
          INSERT INTO product_search_embeddings (
            product_id,
            search_text,
            search_text_hash,
            embedding,
            embedding_model,
            embedding_dimensions,
            updated_at
          )
          VALUES ($1, $2, $3, $4::vector, $5, $6, now())
          ON CONFLICT (product_id)
          DO UPDATE SET
            search_text = EXCLUDED.search_text,
            search_text_hash = EXCLUDED.search_text_hash,
            embedding = EXCLUDED.embedding,
            embedding_model = EXCLUDED.embedding_model,
            embedding_dimensions = EXCLUDED.embedding_dimensions,
            updated_at = now()
        `,
        [
          doc.product.id,
          doc.text,
          doc.hash,
          vectorLiteral,
          GEMINI_MODEL,
          GEMINI_DIMENSIONS,
        ],
      );
    }

    console.log(
      `Indexed ${Math.min(index + BATCH_SIZE, products.length)}/${products.length}`,
    );

    if (DELAY_MS > 0) {
      await sleep(DELAY_MS);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
