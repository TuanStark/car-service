/**
 * Formats a Date or ISO date string (YYYY-MM-DD) into Vietnamese DD/MM/YYYY format:
 * "2026-11-24" -> "24/11/2026"
 */
export function formatVietnameseDate(input: Date | string): string {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = typeof input === "string" ? new Date(input) : input;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formats hours and minutes in 24-hour Vietnamese format (e.g., "09:30")
 */
export function formatVietnameseTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

