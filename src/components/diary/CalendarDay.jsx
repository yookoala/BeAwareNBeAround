// One weekly-calendar cell, mirroring the prototype's .calendar-day DOM 1:1.
export default function CalendarDay({ day }) {
  const lines = day.lines ?? [];
  return (
    <div className={day.today ? 'calendar-day today' : 'calendar-day'}>
      <span className="day-name">{day.name}</span>
      <span className="day-num">{day.num}</span>
      <div className="day-indicators">
        {day.meds.length > 0 && (
          <div className="med-dots">
            {day.meds.map((state, i) => (
              <span key={i} className={state ? `m-dot ${state}` : 'm-dot'} />
            ))}
          </div>
        )}
        {day.eventDot && <div className="event-dot has-record" />}
      </div>
      {lines.length > 0 && (
        <div className="event-line-container">
          {lines.map((line, i) => (
            <div key={i} className={`event-line ${line}`} />
          ))}
        </div>
      )}
    </div>
  );
}
