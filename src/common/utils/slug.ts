/**
 * SLUG UTILITY FUNCTION
 * 
 * Converts any Vietnamese text to URL-friendly slugs
 * - Removes diacritical marks (ả, á, à, ă, â, etc.)
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 * 
 * Example:
 * toSlug('Thuốc giảm đau & hạ sốt') → 'thuoc-giam-dau-ha-sot'
 * toSlug('ACTADOL 500MG!!!') → 'actadol-500mg'
 */
export function toSlug(text: string): string {
  if (!text) return '';

  return text
    // Step 1: Convert to lowercase
    .toLowerCase()
    // Step 2: Normalize unicode (decompose accented characters)
    // NFD = "Canonical Decomposition"
    // This separates letters from diacritical marks
    // Example: "á" becomes "a" + combining acute accent
    .normalize('NFD')
    // Step 3: Remove diacritical marks
    // \u0300-\u036f = Unicode range for combining diacritical marks
    // This regex matches all accents, tildes, cedillas, etc.
    .replace(/[\u0300-\u036f]/g, '')
    // Step 4: Trim whitespace
    .trim()
    // Step 5: Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Step 6: Remove special characters (keep only alphanumeric and hyphens)
    .replace(/[^a-z0-9-]/g, '')
    // Step 7: Collapse multiple consecutive hyphens to single hyphen
    .replace(/-+/g, '-')
    // Step 8: Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Test cases for toSlug() function
 * Useful for validation and documentation
 */
export const SLUG_TEST_CASES = [
  {
    input: 'Actadol 500mg',
    expected: 'actadol-500mg',
    description: 'Basic ASCII with spaces and numbers',
  },
  {
    input: 'PARACETAMOL STADA',
    expected: 'paracetamol-stada',
    description: 'UPPERCASE conversion',
  },
  {
    input: 'Thuốc giảm đau',
    expected: 'thuoc-giam-dau',
    description: 'Vietnamese with accents',
  },
  {
    input: 'Co-Xương-Khớp',
    expected: 'co-xuong-khop',
    description: 'Mixed case with hyphens and accents',
  },
  {
    input: 'Thuốc (250mg)!!',
    expected: 'thuoc-250mg',
    description: 'Remove special characters and punctuation',
  },
  {
    input: 'Viên   uống  bổ  sung',
    expected: 'vien-uong-bo-sung',
    description: 'Multiple consecutive spaces',
  },
  {
    input: '--thuốc---hạ---sốt--',
    expected: 'thuoc-ha-sot',
    description: 'Leading/trailing and multiple hyphens',
  },
  {
    input: '!!!#@$%',
    expected: '',
    description: 'Only special characters',
  },
  {
    input: '',
    expected: '',
    description: 'Empty string',
  },
  {
    input: 'à á ả ã ạ ă ằ ắ ẳ ẵ ặ â ầ ấ ẩ ẫ ậ',
    expected: 'a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
    description: 'All Vietnamese a-based accents',
  },
];

/**
 * Validate slug conversion with unit tests
 * Run this to verify toSlug() works correctly
 */
export function validateSlugFunction(): boolean {
  let passed = 0;
  let failed = 0;

  SLUG_TEST_CASES.forEach((testCase) => {
    const result = toSlug(testCase.input);
    if (result === testCase.expected) {
      console.log(`✅ PASS: ${testCase.description}`);
      passed++;
    } else {
      console.error(
        `❌ FAIL: ${testCase.description}\n` +
        `  Input: "${testCase.input}"\n` +
        `  Expected: "${testCase.expected}"\n` +
        `  Got: "${result}"`
      );
      failed++;
    }
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Export for use in searchParams encoding
export function encodeSlugForUrl(slug: string): string {
  return encodeURIComponent(slug);
}

// Useful for debugging
export function logSlugDebug(text: string): void {
  console.log(`Original: "${text}"`);
  console.log(`Step 1 (lowercase): "${text.toLowerCase()}"`);
  console.log(`Step 2 (normalize): "${text.toLowerCase().normalize('NFD')}"`);
  console.log(`Step 3 (remove accents): "${text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')}"`);
  console.log(`Final slug: "${toSlug(text)}"`);
}
