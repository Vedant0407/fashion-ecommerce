/**
 * GreenO Order ID Utilities
 * Converts long database IDs (e.g. 36-char UUIDs) into clean, concise,
 * memorable streetwear brand order codes like GO-9482-A1 or GO-66B7D37F.
 */

/**
 * Formats any order ID into a short, human-friendly order reference.
 * Examples:
 * - "66b7d37f-6206-48fd-899d-291c75de89c7" -> "GO-66B7D37F"
 * - "GO-9482-A1" -> "GO-9482-A1"
 * - "GO-8231-K9" -> "GO-8231-K9"
 * - "GO-7104-M3" -> "GO-7104-M3"
 * - "GO-12345" -> "GO-12345"
 */
export function formatShortOrderId(orderId?: string | null): string {
  if (!orderId) return "GO-0000";
  const trimmed = String(orderId).trim();
  if (!trimmed) return "GO-0000";

  // Already a clean short GreenO format, e.g. GO-9482-A1 or GO-8231-K9 or GO-9482
  if (/^GO-[0-9A-Z]{3,8}(-[0-9A-Z]{1,4})?$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // If it's a UUID (e.g. 66b7d37f-6206-48fd-899d-291c75de89c7)
  // Take first 8 hex characters: "66B7D37F" -> "GO-66B7D37F"
  const uuidMatch = trimmed.match(/^([0-9a-f]{8})-[0-9a-f]{4}-[0-9a-f]{4}/i);
  if (uuidMatch) {
    return `GO-${uuidMatch[1].toUpperCase()}`;
  }

  // If it has a GO- prefix but is longer than expected (e.g. GO-M4K9X2J1-ABCD)
  if (trimmed.toUpperCase().startsWith("GO-")) {
    const raw = trimmed.slice(3).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return `GO-${raw.slice(0, 7)}`;
  }

  // Generic fallback: clean alphanumeric and take up to 8 characters
  const clean = trimmed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `GO-${clean.slice(0, 8)}`;
}

/**
 * Checks if a user's search query matches an order record ID,
 * supporting both full UUIDs, short formatted IDs, or partial hex prefixes.
 */
export function isOrderMatch(recordId: string, searchInput: string): boolean {
  if (!recordId || !searchInput) return false;

  const cleanRecord = recordId.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanSearch = searchInput.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleanSearch) return false;

  // Exact match on normalized strings
  if (cleanRecord === cleanSearch) return true;

  // Short ID match, e.g. "go66b7d37f" matches "66b7d37f620648fd899d291c75de89c7"
  const searchWithoutPrefix = cleanSearch.replace(/^go/, "");
  if (searchWithoutPrefix.length >= 4) {
    if (cleanRecord.startsWith(searchWithoutPrefix)) return true;
    if (cleanRecord.replace(/^go/, "").startsWith(searchWithoutPrefix)) return true;
  }

  const shortRecord = formatShortOrderId(recordId).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (shortRecord === cleanSearch) return true;
  if (shortRecord.replace(/^go/, "") === searchWithoutPrefix) return true;

  return false;
}
