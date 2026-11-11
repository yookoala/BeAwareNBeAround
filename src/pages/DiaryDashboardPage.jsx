import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import CalendarDay from '../components/diary/CalendarDay';
import { calendarLabel } from '../components/diary/calendarLabel';
import Modal from '../components/diary/Modal';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { useRecentEntries } from '../hooks/useRecentEntries';
import { navigateWithViewTransition } from '../utils/viewTransition';
import { ENTRY_ICONS, entrySummary, entryTypeTitle, formatEntryTime } from '../utils/entryPresentation';
import { past7Days, thisWeekDays, monthDays, monthEmptyCells, monthHeaderDays } from '../data/mockDashboard';
import '../styles/dashboard.css';
import '../styles/entry-cards.css';

export default function DiaryDashboardPage() {
  const navigate = useNavigate();
  usePageBodyClass('page-dashboard');
  const { entries, loading, error } = useRecentEntries(5);
  const [calendarView, setCalendarView] = useState('past7');
  const [modal, setModal] = useState(null);
  const closeModal = useCallback(() => setModal(null), []);
  const openEventMenu = useCallback(
    () => navigateWithViewTransition(navigate, '/diary/event', 'vt-slide-in-right'),
    [navigate],
  );
  const openEntriesList = useCallback(
    () => navigateWithViewTransition(navigate, '/diary/entries', 'vt-slide-in-right'),
    [navigate],
  );
  const weekdays = {
    '日': t({ id: 'diary.weekday.sun', message: 'Sun' }),
    '一': t({ id: 'diary.weekday.mon', message: 'Mon' }),
    '二': t({ id: 'diary.weekday.tue', message: 'Tue' }),
    '三': t({ id: 'diary.weekday.wed', message: 'Wed' }),
    '四': t({ id: 'diary.weekday.thu', message: 'Thu' }),
    '五': t({ id: 'diary.weekday.fri', message: 'Fri' }),
    '六': t({ id: 'diary.weekday.sat', message: 'Sat' }),
  };
  return (
    <div className="app-container" id="appContainer">
      <h1 className="dashboard-title">{t({ id: 'diary.dashboard.title', message: 'Epilepsy and Headache Tracking' })}</h1>
      <div className="section-title">
        <div className="calendar-controls"><span>{t({ id: 'diary.daily', message: 'Daily records' })}</span>
          <select id="calendarViewSelector" className="calendar-selector" aria-label={t({ id: 'diary.calendarView', message: 'Calendar view' })} value={calendarView} onChange={(e) => setCalendarView(e.target.value)}>
            <option value="past7">{t({ id: 'diary.past7', message: 'Past 7 days' })}</option>
            <option value="thisWeek">{t({ id: 'diary.thisWeek', message: 'This week' })}</option>
          </select>
        </div>
        <button className="month-button" onClick={() => setModal('monthly')}>{t({ id: 'diary.fullCalendar', message: '📅 Full calendar ➔' })}</button>
      </div>
      {[['past7', past7Days, 'cal-past-7'], ['thisWeek', thisWeekDays, 'cal-this-week']].map(([view, days, id]) => (
        <div key={view} id={id} hidden={calendarView !== view} className={calendarView === view ? 'weekly-calendar' : 'weekly-calendar hidden'}>
          {days.map((day) => <CalendarDay key={day.num} day={{ ...day, name: weekdays[day.name] }} />)}
        </div>
      ))}
      <div className="calendar-legend">
        <div className="legend-item"><div className="med-dots"><span className="m-dot taken" /><span className="m-dot taken" /><span className="m-dot missed" /></div>{t({ id: 'diary.legend.meds', message: 'Medication (green=taken/yellow=missed)' })}</div>
        <div className="legend-item"><div className="event-dot has-record" /><span id="legend-event-text">{t({ id: 'diary.legend.event', message: 'Seizure/Headache' })}</span></div>
        <div className="legend-item"><div className="legend-line period" />{t({ id: 'diary.legend.period', message: 'Period' })}</div>
        <div className="legend-item"><div className="legend-line illness" />{t({ id: 'diary.legend.illness', message: 'Illness/Stress' })}</div>
      </div>
      <div className="section-title">{t({ id: 'diary.recentEntries', message: 'Recent entries' })}</div>
      {loading ? null : error ? (
        <p className="recent-records-unavailable">{t({ id: 'diary.recordsUnavailable', message: 'Records unavailable — this device could not open its diary storage.' })}</p>
      ) : entries.length === 0 ? (
        <p className="recent-empty">{t({ id: 'diary.recent.empty', message: 'No entries yet — tap the ✏️ button below to record your first one.' })}</p>
      ) : (
        <div className="recent-entries-list">
          {entries.map((entry) => (
            <div key={entry.id} className="recent-entry-card">
              <span className="recent-entry-icon" aria-hidden="true">{ENTRY_ICONS[entry.type]}</span>
              <div className="recent-entry-body">
                <div className="recent-entry-header">
                  <strong className="recent-entry-title">{entryTypeTitle(entry.type)}</strong>
                  <span className="recent-entry-time">{formatEntryTime(entry.time)}</span>
                </div>
                <p className="recent-entry-summary">{entrySummary(entry)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading || error ? null : (
        <button type="button" className="see-all-btn" onClick={openEntriesList}>{t({ id: 'diary.recent.viewAll', message: '📋 View all entries ➔' })}</button>
      )}
      <div className="section-title">{t({ id: 'diary.medicalData', message: 'My medical information' })}</div>
      <button className="profile-card" onClick={() => navigate('/diary/profile')}>
        <span className="profile-icon" aria-hidden="true">👤</span><div className="profile-text"><strong>{t({ id: 'diary.profile', message: 'Personal medical profile' })}</strong><p id="profileDesc">{t({ id: 'diary.profileDesc', message: '(Optional) Add comprehensive diagnostic information, seizure types, EEG and other data to help generate a more accurate and complete PDF report for your doctor.' })}</p></div>
      </button>
      <div className="report-card">
        <button data-report="level-a" onClick={() => navigate('/diary/report/level-a')}>{t({ id: 'diary.reportA', message: '📊 Clinic report (Level A)' })}</button>
        <button data-report="level-b" onClick={() => navigate('/diary/report/level-b')}>{t({ id: 'diary.reportB', message: '📋 Historical summary (Level B)' })}</button>
      </div>
      <div className="privacy-note"><span aria-hidden="true">🔒</span><span>{t({ id: 'diary.privacy', message: 'Privacy: data is stored only on your device or in your cloud, never uploaded to the Foundation.' })}</span></div>
      <button type="button" className="fab-record" id="fabRecord" title={t({ id: 'diary.emergencyVideo', message: 'Emergency video' })} aria-label={t({ id: 'diary.emergencyVideo', message: 'Emergency video' })} onClick={openEventMenu}>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      {modal === 'monthly' && <Modal id="monthlyModal" title={t({ id: 'diary.monthTitle', message: 'September 2026 records' })} onClose={closeModal}>
        <div className="month-grid">
          {monthHeaderDays.map((day) => <div key={day} className="month-header-day">{weekdays[day]}</div>)}
          {Array.from({ length: monthEmptyCells }, (_, i) => <div key={`empty-${i}`} className="month-day empty" />)}
          {monthDays.map((day) => {
            const label = calendarLabel(day, String(day.num));
            return (
              <div key={day.num} className={day.today ? 'month-day today' : 'month-day'} role={label ? 'img' : undefined} aria-label={label}>
                {day.num}
                <div className="day-indicators">
                  {day.meds.length > 0 && <div className="med-dots">{day.meds.map((state, i) => <span key={i} className={state ? `m-dot ${state}` : 'm-dot'} />)}</div>}
                  {day.eventDot && <div className="event-dot has-record" />}
                </div>
                {day.lines?.length > 0 && <div className="event-line-container">{day.lines.map((line) => <div key={line} className={`event-line ${line}`} />)}</div>}
              </div>
            );
          })}
        </div>
        <div className="modal-legend"><div className="legend-item"><div className="med-dots"><span className="m-dot taken" /><span className="m-dot missed" /></div>{t({ id: 'diary.monthMeds', message: 'Multiple medications (green/yellow)' })}</div><div className="legend-item"><div className="event-dot has-record" />{t({ id: 'diary.legend.event', message: 'Seizure/Headache' })}</div><div className="legend-item"><div className="legend-line period" />{t({ id: 'diary.legend.period', message: 'Period' })}</div><div className="legend-item"><div className="legend-line illness" />{t({ id: 'diary.monthIllness', message: 'URTI/surgery/stress etc.' })}</div></div>
      </Modal>}
    </div>
  );
}
