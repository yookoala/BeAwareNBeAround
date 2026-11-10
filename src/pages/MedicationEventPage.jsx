import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { navigateWithViewTransition } from '../utils/viewTransition';
import '../styles/event-log.css';

export default function MedicationEventPage() {
  const navigate = useNavigate();
  usePageBodyClass('page-event-log');

  return (
    <div className="app-container">
      <header className="diary-subheader">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigateWithViewTransition(navigate, '/diary/event', 'vt-slide-out-right')}
        >
          {t({ id: 'diary.eventLog.back', message: '← Back' })}
        </button>
        <div className="header-title">{t({ id: 'diary.meds', message: 'Medication record' })}</div>
        <span aria-hidden="true" style={{ width: '56px' }} />
      </header>
      <div className="coming-soon-card">
        <div className="coming-soon-icon" aria-hidden="true">💊</div>
        <p className="coming-soon-text">{t({ id: 'diary.comingSoon', message: 'Coming soon' })}</p>
      </div>
    </div>
  );
}
