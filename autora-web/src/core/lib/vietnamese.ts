/**
 * Normalizes Vietnamese strings for accent-insensitive search so users can type
 * either "Quận 7", "Bình Thạnh", "phủ ceramic" OR "quan 7", "binh thanh", "phu ceramic".
 */
export function normalizeVietnameseText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

