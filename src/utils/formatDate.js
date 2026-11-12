/**
 * Utility functions for Date Formatting in Indonesian locale
 */

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Format date to standard Indonesian format: "DD MMMM YYYY"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatIndonesianDate(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format date to short Indonesian format: "DD MMM YYYY"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatShortDate(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = MONTH_SHORT_NAMES[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format date and time: "DD MMMM YYYY, HH:mm WIB"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
}

/**
 * Format relative time (e.g., "Baru saja", "5 menit lalu", "2 hari lalu")
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Baru saja';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} menit lalu`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} jam lalu`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} hari lalu`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} bulan lalu`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} tahun lalu`;
}

/**
 * Format career experience period (e.g. "Jan 2022 - Des 2023" or "Jan 2023 - Sekarang")
 * @param {string|Date} startDate
 * @param {string|Date|null} endDate
 * @param {boolean} isCurrent
 * @returns {string}
 */
export function formatPeriod(startDate, endDate, isCurrent = false) {
  if (!startDate) return '-';
  const start = new Date(startDate);
  const startStr = isNaN(start.getTime()) ? '-' : `${MONTH_SHORT_NAMES[start.getMonth()]} ${start.getFullYear()}`;

  if (isCurrent || !endDate) {
    return `${startStr} - Sekarang`;
  }

  const end = new Date(endDate);
  const endStr = isNaN(end.getTime()) ? '-' : `${MONTH_SHORT_NAMES[end.getMonth()]} ${end.getFullYear()}`;
  return `${startStr} - ${endStr}`;
}

/**
 * Calculate duration between two dates (e.g., "2 tahun 3 bulan")
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {string}
 */
export function calculateDuration(startDate, endDate = new Date()) {
  if (!startDate) return '';
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  const parts = [];
  if (years > 0) parts.push(`${years} thn`);
  if (remainingMonths > 0 || years === 0) parts.push(`${remainingMonths} bln`);

  return parts.join(' ');
}

export default {
  formatIndonesianDate,
  formatShortDate,
  formatDateTime,
  formatRelativeTime,
  formatPeriod,
  calculateDuration
};
