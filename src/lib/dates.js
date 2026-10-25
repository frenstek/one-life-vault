/** Local date as YYYY-MM-DD (avoids UTC offset issues in AU timezones) */
export function toLocalDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Local datetime as YYYY-MM-DDTHH:MM (for datetime-local inputs) */
export function toLocalDatetime(d = new Date()) {
  return `${toLocalDate(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
