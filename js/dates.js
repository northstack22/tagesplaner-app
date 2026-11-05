// Hilfen rund ums Datum.
// Ein Tag wird überall als Text im Format "JJJJ-MM-TT" gespeichert, z. B. "2026-11-05".
// So lassen sich Tage einfach vergleichen und sortieren.

const pad = (n) => String(n).padStart(2, '0');

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidKey(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && toKey(fromKey(value)) === value;
}

export function todayKey() {
  return toKey(new Date());
}

export function addDays(key, days) {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

export function daysBetween(fromK, toK) {
  return Math.round((fromKey(toK) - fromKey(fromK)) / 86400000);
}

// Montag der Woche, in der der Tag liegt.
export function startOfWeek(key) {
  const d = fromKey(key);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toKey(d);
}

// Kalenderwoche nach deutscher Zählung (ISO 8601).
export function weekNumber(key) {
  const d = fromKey(key);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
}

const format = (options) => new Intl.DateTimeFormat('de-DE', options);
const LONG = format({ weekday: 'long', day: 'numeric', month: 'long' });
const DAY_MONTH = format({ day: 'numeric', month: 'long' });
const FULL = format({ day: 'numeric', month: 'long', year: 'numeric' });
const SHORT = format({ weekday: 'short', day: 'numeric', month: 'numeric' });
const WEEKDAY = format({ weekday: 'long' });
const MONTH_YEAR = format({ month: 'long', year: 'numeric' });

export const formatLong = (key) => LONG.format(fromKey(key)); // Donnerstag, 5. November
export const formatDayMonth = (key) => DAY_MONTH.format(fromKey(key)); // 5. November
export const formatFull = (key) => FULL.format(fromKey(key)); // 5. November 2026
export const formatShort = (key) => SHORT.format(fromKey(key)); // Do., 5.11.
export const weekdayName = (key) => WEEKDAY.format(fromKey(key)); // Donnerstag
export const monthTitle = (year, month) => MONTH_YEAR.format(new Date(year, month, 1)); // November 2026

export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
