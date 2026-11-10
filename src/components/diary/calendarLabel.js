import { t } from '@lingui/core/macro';

// Keep the date in the accessible name: aria-label replaces the visible text.
export function calendarLabel(day, date) {
  const taken = day.meds.filter((state) => state === 'taken').length;
  const missed = day.meds.filter((state) => state === 'missed').length;
  const unrecorded = day.meds.filter((state) => state === '').length;
  const indicators = [];
  if (taken) indicators.push(t({ id: 'diary.calendar.taken', message: `Taken: ${taken}` }));
  if (missed) indicators.push(t({ id: 'diary.calendar.missed', message: `Missed: ${missed}` }));
  if (unrecorded) indicators.push(t({ id: 'diary.calendar.unrecorded', message: `Not recorded: ${unrecorded}` }));
  if (day.eventDot) indicators.push(t({ id: 'diary.legend.event', message: 'Seizure/Headache' }));
  if (day.lines?.includes('period')) indicators.push(t({ id: 'diary.legend.period', message: 'Period' }));
  if (day.lines?.includes('illness')) indicators.push(t({ id: 'diary.legend.illness', message: 'Illness/Stress' }));
  return indicators.length ? [date, ...indicators].join(', ') : undefined;
}
