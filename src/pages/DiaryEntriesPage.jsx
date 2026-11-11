import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useLocation, useNavigate } from 'react-router-dom';
import EntryCard from '../components/diary/EntryCard';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { navigateWithViewTransition } from '../utils/viewTransition';
import { listEntries } from '../services/diaryEntries';
import '../styles/entries-list.css';
import '../styles/entry-cards.css';

// Only PAGE_SIZE cards are mounted at a time: an IntersectionObserver on the
// bottom sentinel loads the next page as the user scrolls (PLAN12: the full
// list never renders the whole history at once).
const PAGE_SIZE = 25;

export default function DiaryEntriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  usePageBodyClass('page-diary-entries');
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [hasMore, setHasMore] = useState(false);
  // Set by the detail page after a confirmed delete (router navigation state).
  const [deletedToast, setDeletedToast] = useState(Boolean(location.state?.deleted));
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!deletedToast) return undefined;
    const timer = setTimeout(() => setDeletedToast(false), 2000);
    return () => clearTimeout(timer);
  }, [deletedToast]);

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
              {entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
            </div>
          )}
          {entries.length > 0 && (hasMore
            ? <div ref={sentinelRef} className="entries-sentinel" aria-hidden="true" />
            : <div className="entries-end">{t({ id: 'diary.entries.end', message: '— End of list —' })}</div>)}
        </>
      )}
      {deletedToast && <div role="status" className="entries-toast">{t({ id: 'diary.entry.deleted', message: 'Entry deleted' })}</div>}
    </div>
  );
}
