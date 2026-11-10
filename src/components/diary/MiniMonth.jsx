// Mini-month heatmap grid mirroring report-level-a.html's .mini-month:
// weekday headers 日..六, leading empty cells from the weekday of day 1
// (deterministic for the frozen fixture months), day cells with optional
// mark-attack / mark-period marks.
import { t } from '@lingui/core/macro';

export default function MiniMonth({ year, month, marks }) {
  const weekdays = [t({ id: 'report.sun', message: 'Sun' }), t({ id: 'report.mon', message: 'Mon' }), t({ id: 'report.tue', message: 'Tue' }), t({ id: 'report.wed', message: 'Wed' }), t({ id: 'report.thu', message: 'Thu' }), t({ id: 'report.fri', message: 'Fri' }), t({ id: 'report.sat', message: 'Sat' })];
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const title = `${year}-${String(month).padStart(2, '0')}`;

  return (
    <div className="mini-month">
      <div className="mini-month-title">{title}</div>
      <div className="mini-grid">
        {weekdays.map((w) => (
          <div key={w} className="mini-day-hdr">{w}</div>
        ))}
        {Array.from({ length: firstWeekday }, (_, i) => (
          <div key={`empty-${i}`} className="mini-day empty"></div>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const mark = marks[day];
          const meaning = mark === 'attack' ? t({ id: 'report.seizureDay', message: 'Seizure day' }) : mark === 'period' ? t({ id: 'report.periodIllness', message: 'Period/illness' }) : undefined;
          const date = `${title}-${String(day).padStart(2, '0')}`;
          return (
            <div key={day} className={`mini-day${mark ? ` mark-${mark}` : ''}`} role={meaning ? 'img' : undefined} aria-label={meaning ? `${date}, ${meaning}` : undefined}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
