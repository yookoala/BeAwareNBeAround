import { t } from '@lingui/core/macro';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { hubKeys } from '../data/mockDashboard';
import '../styles/resource.css';

export default function ResourcePage() {
  usePageBodyClass('page-resource');
  const hubButtons = {
    social: t({ id: 'diary.hub.social', message: '🌐 Social media' }),
    events: t({ id: 'diary.hub.events', message: '📅 Latest events' }),
    about: t({ id: 'diary.hub.about', message: 'ℹ️ About us' }),
    courses: t({ id: 'diary.hub.courses', message: '📚 Online courses' }),
    donate: t({ id: 'diary.hub.donate', message: '💖 Donate' }),
    contact: t({ id: 'diary.hub.contact', message: '📞 Contact us' }),
  };

  return (
    <div className="app-container" id="resourceContainer">
      <h1 className="resource-title">
        {t({ id: 'diary.hub', message: 'Epilepsy Foundation of Hong Kong Resource Centre' })}
      </h1>
      <div className="resource-list">
        <a
          href="https://epilepsy.org.hk/"
          target="_blank"
          rel="noopener noreferrer"
          className="resource-item resource-item-primary"
        >
          <span>{t({ id: 'resource.website', message: '🏠 Epilepsy Foundation of Hong Kong (Official Website)' })}</span>
          <span aria-hidden="true">➔</span>
        </a>
        {hubKeys.map((key) => (
          <button key={key} type="button" className="resource-item">
            <span>{hubButtons[key]}</span>
            <span aria-hidden="true">➔</span>
          </button>
        ))}
        <a
          href="https://linktr.ee/EpilepsyFoundationOfHongKong"
          target="_blank"
          rel="noopener noreferrer"
          className="resource-item resource-item-linktree"
        >
          <span>{t({ id: 'resource.moreLinks', message: '🔗 More Links' })}</span>
          <span aria-hidden="true">➔</span>
        </a>
      </div>
    </div>
  );
}
