/**
 * NDIS SIL (Supported Independent Living) rate constants and helpers.
 * Rates are per worker hour (full 1:1 ratio).
 * For shared support, divide by the ratio denominator (e.g., 1:3 = divide by 3).
 */

export const NDIS_SIL_RATES = {
  '01_801_0115_1_1': { name: 'Weekday Daytime', period: 'Mon-Sun', rate: 70.23 },
  '01_802_0115_1_1': { name: 'Weekday Evening', period: 'Mon-Sun', rate: 74.37 },
  '01_803_0115_1_1': { name: 'Weekday Night', period: 'Mon-Sun', rate: 78.81 },
  '01_804_0115_1_1': { name: 'Saturday', period: 'Mon-Sun', rate: 98.82 },
  '01_805_0115_1_1': { name: 'Sunday', period: 'Mon-Sun', rate: 127.44 },
  '01_806_0115_1_1': { name: 'Public Holiday', period: 'Mon-Sun', rate: 156.03 },
  '01_832_0115_1_1': { name: 'Sleepover', period: 'Mon-Sun', rate: 297.60, isFlat: true },
};

/**
 * Get the divisor for a support ratio string like "1:3".
 * @param {string} ratio - e.g. "1:1", "1:2", "1:3", "1:4"
 * @returns {number}
 */
export function getRatioMultiplier(ratio) {
  const map = { '1:1': 1, '1:2': 2, '1:3': 3, '1:4': 4 };
  return map[ratio] || 3;
}

/**
 * Determine the NDIS support item code for a shift based on date, type, and times.
 * @param {string} shiftDate - 'YYYY-MM-DD'
 * @param {string} shiftType - 'morning', 'afternoon', 'night', 'sleepover'
 * @param {string} startTime - 'HH:MM'
 * @param {string} endTime - 'HH:MM'
 * @returns {string} NDIS item code
 */
export function getItemForShift(shiftDate, shiftType, startTime, endTime) {
  if (shiftType === 'sleepover') return '01_832_0115_1_1';

  const day = new Date(shiftDate + 'T00:00:00').getDay(); // 0=Sun, 6=Sat
  if (day === 0) return '01_805_0115_1_1'; // Sunday
  if (day === 6) return '01_804_0115_1_1'; // Saturday

  // Weekday — determine time-of-day rate
  const startHour = parseInt(startTime.split(':')[0]);
  if (startHour >= 20) return '01_802_0115_1_1'; // Evening 8PM+
  if (startHour < 6) return '01_803_0115_1_1';   // Night before 6AM
  return '01_801_0115_1_1'; // Weekday daytime
}

/**
 * Calculate hours between start_time and end_time (HH:MM strings).
 * Handles overnight shifts where end < start.
 * @param {string} startTime - 'HH:MM'
 * @param {string} endTime - 'HH:MM'
 * @returns {number} hours (decimal)
 */
export function calcShiftHours(startTime, endTime) {
  const [sh, sm] = (startTime || '0:0').split(':').map(Number);
  const [eh, em] = (endTime || '0:0').split(':').map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60; // overnight
  return (endMins - startMins) / 60;
}
