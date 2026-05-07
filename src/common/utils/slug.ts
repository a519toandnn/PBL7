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


