// Default value for datetime-local pickers: the current local wall-clock
// time in the exact 'YYYY-MM-DDTHH:mm' format those inputs use.
export function localNowValue() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
