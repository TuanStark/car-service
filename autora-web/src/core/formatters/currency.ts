/**
 * Formats an integer amount in Vietnamese Đồng following native local convention:
 * 450000 -> "450.000đ"
 * 1200000 -> "1.200.000đ"
 * 3500000 -> "3.500.000đ"
 */
export function formatVND(amount: number): string {
  const rounded = Math.round(amount);
  const formattedDigits = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedDigits}đ`;
}

/**
 * Formats a starting price in Vietnamese style: "từ 450.000đ"
 */
export function formatStartingVND(amount: number): string {
  return `từ ${formatVND(amount)}`;
}

