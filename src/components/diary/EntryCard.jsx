import { useNavigate } from 'react-router-dom';
import { ENTRY_ICONS, entrySummary, entryTypeTitle, formatEntryTime } from '../../utils/entryPresentation';
import { navigateWithViewTransition } from '../../utils/viewTransition';

// One entry rendered as a tappable card (M19-005): the dashboard Recent list
// and the full entries list share this component so both navigate to the
// detail view identically. It is a real <button> (all flow elements are
// spans because buttons only allow phrasing content), so keyboard users can
// Tab to a card and press Enter to open it.
export default function EntryCard({ entry }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="recent-entry-card"
      onClick={() => navigateWithViewTransition(navigate, `/diary/entry/${entry.id}`, 'vt-slide-in-right')}
    >
      <span className="recent-entry-icon" aria-hidden="true">{ENTRY_ICONS[entry.type]}</span>
      <span className="recent-entry-body">
        <span className="recent-entry-header">
          <span className="recent-entry-title">{entryTypeTitle(entry.type)}</span>
          <span className="recent-entry-time">{formatEntryTime(entry.time)}</span>
        </span>
        <span className="recent-entry-summary">{entrySummary(entry)}</span>
      </span>
    </button>
  );
}
