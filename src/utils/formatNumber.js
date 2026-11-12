/**
 * Utility functions for Number & Currency Formatting in Indonesian locale
 */

/**
 * Format a number as Indonesian Rupiah (IDR)
 * @param {number|string} amount
 * @param {boolean} withPrefix - include 'Rp ' prefix
 * @returns {string}
 */
export function formatRupiah(amount, withPrefix = true) {
  if (amount === undefined || amount === null || amount === '') return '-';

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';

  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0
  }).format(num);

  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format salary range
 * @param {number|string} min
 * @param {number|string} max
 * @returns {string}
 */
export function formatSalaryRange(min, max) {
  if (!min && !max) return 'Gaji Dirahasiakan';
  if (min && !max) return `Mulai dari ${formatRupiah(min)}`;
  if (!min && max) return `Hingga ${formatRupiah(max)}`;

  return `${formatRupiah(min)} - ${formatRupiah(max)}`;
}

/**
 * Format regular number with thousand separators (e.g., 1.500)
 * @param {number|string} number
 * @returns {string}
 */
export function formatNumber(number) {
  if (number === undefined || number === null || number === '') return '0';
  const num = typeof number === 'string' ? parseFloat(number) : number;
  if (isNaN(num)) return '0';

  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format compact number with Indonesian unit (jt, rb)
 * @param {number} value
 * @returns {string}
 */
export function formatCompactNumber(value) {
  if (!value || isNaN(value)) return '0';

  if (value >= 1000000) {
    const jt = (value / 1000000).toFixed(1).replace('.0', '');
    return `${jt} jt`;
  }
  if (value >= 1000) {
    const rb = (value / 1000).toFixed(1).replace('.0', '');
    return `${rb} rb`;
  }
  return String(value);
}

/**
 * Format percentage value (e.g. 95 -> "95%")
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(value, decimals = 0) {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  const num = parseFloat(value);
  return `${num.toFixed(decimals)}%`;
}

/**
 * Parse currency string to raw numeric integer
 * @param {string} rupiahString
 * @returns {number}
 */
export function parseRupiahInput(rupiahString) {
  if (!rupiahString) return 0;
  const cleaned = String(rupiahString).replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

export default {
  formatRupiah,
  formatSalaryRange,
  formatNumber,
  formatCompactNumber,
  formatPercent,
  parseRupiahInput
};
