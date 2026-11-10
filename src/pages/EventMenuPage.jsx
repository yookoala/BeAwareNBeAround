import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { navigateWithViewTransition } from '../utils/viewTransition';
import '../styles/event-log.css';

export default function EventMenuPage() {
  const navigate = useNavigate();
  usePageBodyClass('page-event-log');

  const menuItems = [
    {
      id: 'btn-attack',
      icon: '⚡',
      label: t({ id: 'diary.seizure', message: 'Seizure record' }),
      path: '/diary/event/seizure',
    },
    {
      id: 'btn-headache',
      icon: '🤕',
      label: t({ id: 'diary.headache', message: 'Headache record' }),
      path: '/diary/event/headache',
    },
    {
      id: 'btn-meds',
      icon: '💊',
      label: t({ id: 'diary.meds', message: 'Medication record' }),
      path: '/diary/event/medication',
    },
    {
      id: 'btn-side',
      icon: '😵‍💫',
      label: t({ id: 'diary.sideEffects', message: 'Side effects' }),
      path: '/diary/event/side-effects',
    },
    {
      id: 'btn-health',
      icon: '⏳',
      label: t({ id: 'diary.health', message: 'Physiology and health' }),
      path: '/diary/event/health',
    },
  ];

  return (
    <div className="app-container">
      <header className="diary-subheader">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigateWithViewTransition(navigate, '/diary', 'vt-slide-out-right')}
        >
          {t({ id: 'diary.eventLog.back', message: '← Back' })}
        </button>
        <div className="header-title">{t({ id: 'diary.eventLog.title', message: 'New Entry' })}</div>
        <span aria-hidden="true" style={{ width: '56px' }} />
      </header>
      <div className="event-menu-list">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            id={item.id}
            className="event-menu-btn"
            onClick={() => navigateWithViewTransition(navigate, item.path, 'vt-slide-in-right')}
          >
            <span className="event-menu-icon" aria-hidden="true">{item.icon}</span>
            <span className="event-menu-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
