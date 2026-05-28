export function extractStrengths(text: string): string[] {
  return Array.from(
    text.toLowerCase().matchAll(/\b\d+(?:[.,]\d+)?\s*(mg|g|mcg|ml|iu)\b/g),
    (match) => match[0].replace(/\s+/g, ''),
  );
}

export function hasStrengthMismatch(
  query: string,
  productText: string,
): boolean {
  const queryStrengths = extractStrengths(query);
  if (queryStrengths.length === 0) {
    return false;
  }

  const productStrengths = extractStrengths(productText);
  if (productStrengths.length === 0) {
    return false;
  }

  return !queryStrengths.some((strength) => productStrengths.includes(strength));
}
