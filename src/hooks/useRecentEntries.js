import { useEffect, useState } from 'react';
import { listRecent } from '../services/diaryEntries';

// Loads the newest stored entries once on mount. `loading` separates the
// pending state from a genuinely empty store, and `error` lets views show
// "records unavailable" instead of the empty state (PLAN12).
export function useRecentEntries(limit = 5) {
  const [state, setState] = useState({ entries: [], loading: true, error: false });

  useEffect(() => {
    let active = true;
    listRecent(limit)
      .then((entries) => {
        if (active) setState({ entries, loading: false, error: false });
      })
      .catch(() => {
        if (active) setState({ entries: [], loading: false, error: true });
      });
    return () => {
      active = false;
    };
  }, [limit]);

  return state;
}
