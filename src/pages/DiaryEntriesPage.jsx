import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { navigateWithViewTransition } from '../utils/viewTransition';
import { ENTRY_ICONS, entrySummary, entryTypeTitle, formatEntryTime } from '../utils/entryPresentation';
import { listEntries } from '../services/diaryEntries';
import '../styles/entries-list.css';
import '../styles/entry-cards.css';

// Only PAGE_SIZE cards are mounted at a time: an IntersectionObserver on the
// bottom sentinel loads the next page as the user scrolls (PLAN12: the full
// list never renders the whole history at once).
const PAGE_SIZE = 25;

export default function DiaryEntriesPage() {
  const navigate = useNavigate();
  usePageBodyClass('page-diary-entries');
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [hasMore, setHasMore] = useState(false);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const loadNextPage = useCallback((before) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    listEntries({ limit: PAGE_SIZE, before })
      .then((page) => {
        setEntries((prev) => (before ? [...prev, ...page] : page));
        setHasMore(page.length === PAGE_SIZE);
        setStatus('ready');
      })
      .catch(() => setStatus('error'))
      .finally(() => {
        loadingRef.current = false;
      });
  }, []);

  useEffect(() => {
    loadNextPage(undefined);
  }, [loadNextPage]);

  // Re-armed whenever the rendered list changes, so the sentinel keeps
  // firing until the store is exhausted.
  useEffect(() => {
    if (status !== 'ready' || !hasMore) return undefined;
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver((records) => {
      if (!records.some((record) => record.isIntersecting)) return;
      const last = entries[entries.length - 1];
      if (last) loadNextPage([last.time, last.id]);
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [status, hasMore, entries, loadNextPage]);

  function goBack() {
    navigateWithViewTransition(navigate, '/diary', 'vt-slide-out-right');
  }

  return (
    <div className="app-container" id="appContainer">
      <div className="diary-subheader">
        <button type="button" className="back-btn" onClick={goBack}>{t({ id: 'diary.eventLog.back', message: '← Back' })}</button>
        <div className="header-title">{t({ id: 'diary.entries.title', message: 'All entries' })}</div>
      </div>
      {status === 'loading' ? null : status === 'error' ? (
        <p className="recent-records-unavailable">{t({ id: 'diary.recordsUnavailable', message: 'Records unavailable — this device could not open its diary storage.' })}</p>
      ) : (
        <>
          {entries.length === 0 ? (
            <p className="recent-empty">{t({ id: 'diary.entries.empty', message: 'No entries yet. Saved records will appear here.' })}</p>
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
          {entries.length > 0 && (hasMore
            ? <div ref={sentinelRef} className="entries-sentinel" aria-hidden="true" />
            : <div className="entries-end">{t({ id: 'diary.entries.end', message: '— End of list —' })}</div>)}
        </>
      )}
    </div>
  );
}
