/**
 * Converts a Vietnamese title into a clean ASCII kebab-case URL slug.
 */
export function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

const CATEGORY_SKU_PREFIX: Record<string, string> = {
  MAINTENANCE: "BD",
  REPAIR: "SC",
  DETAILING: "DT",
  TIRES: "LP",
  "bao-duong": "BD",
  "sua-chua": "SC",
  detailing: "DT",
  "lop-mam": "LP",
};

/**
 * Generates a unique, standard-format SKU from category code (e.g. ATR-BD-4821).
 */
export function generateServiceSku(categoryCode?: string): string {
  const normalizedCode = categoryCode?.trim() ?? "";
  const prefix =
    CATEGORY_SKU_PREFIX[normalizedCode] ??
    CATEGORY_SKU_PREFIX[normalizedCode.toUpperCase()] ??
    (normalizedCode.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() ||
      "DV");
  const suffix = String(Date.now()).slice(-4);
  return `ATR-${prefix}-${suffix}`;
}

