import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getEntry } from '../services/diaryEntries';

/**
 * Edit-mode seeding shared by the three diary forms (M19-006): reads
 * ?edit=<id>, loads the stored entry, and hands it to the page's seed
 * callback before the form becomes interactive (`settled`). Unknown or
 * unreadable ids settle with no entry so the page falls back to create-mode
 * defaults, and the stale edit param is dropped from the URL.
 *
 * The seed runs inside the getEntry().then chain (not synchronously in an
 * effect), matching the project lint rule against cascading setState-in-
 * effect renders. seed itself lives in a ref refreshed by a dep-less effect
 * because page closures recreate it every render, while the load effect only
 * depends on the id and the location-derived searchParams (react-router
 * memoizes both on location.search), so page state updates never re-trigger
 * the load.
 */
export function useEditingEntry(seed) {
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get('edit');
  const seedRef = useRef(seed);
  const [entry, setEntry] = useState(null);
  const [settled, setSettled] = useState(!editingId);

  useEffect(() => {
    seedRef.current = seed;
  });

  useEffect(() => {
    if (!editingId) return undefined;
    getEntry(editingId)
      .then((found) => {
        if (found) {
          seedRef.current(found);
          setEntry(found);
        } else {
          const next = new URLSearchParams(searchParams);
          next.delete('edit');
          setSearchParams(next, { replace: true });
        }
        setSettled(true);
      })
      .catch(() => setSettled(true));
    return undefined;
  }, [editingId, searchParams, setSearchParams]);

  return { editingId, entry, settled };
}
