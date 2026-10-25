// Shift times on progress notes (21 Oct 2026). NDIS shifts are not fixed, so staff enter their ACTUAL start and finish
// time; it is saved in progress_notes.shift as e.g. "9:00pm - 8:00am". Old notes carry preset labels such as
// "Sleepover 10pm-6am" / "Morning 6am-2pm" / "Custom" that did not match the real times: those are never shown.

// '21:00' -> '9:00pm'
export function to12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
}

// '9:00pm' -> '21:00'
export function to24(t) {
  const m = (t || '').trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!m) return '';
  let h = Number(m[1]) % 12;
  if (m[3] === 'pm') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

const ACTUAL = /^(\d{1,2}:\d{2}\s*[ap]m)\s*-\s*(\d{1,2}:\d{2}\s*[ap]m)$/i;

// The shift text to display, or '' for old preset labels
export function shiftTimeLabel(shift) {
  return ACTUAL.test((shift || '').trim()) ? shift.trim() : '';
}

// start/finish ('HH:MM') from a stored value; blank for old preset labels
export function parseShiftTime(shift) {
  const m = (shift || '').trim().match(ACTUAL);
  return m ? { shift_start: to24(m[1]), shift_end: to24(m[2]) } : { shift_start: '', shift_end: '' };
}

export function composeShiftTime(start, end) {
  return start && end ? `${to12(start)} - ${to12(end)}` : '';
}
