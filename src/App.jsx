import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { getInstallId } from './services/install';
import { useClickCounter } from './hooks/useClickCounter';
import FirstAidPage from './pages/FirstAidPage';

// App shell (PLAN06 M13-001): owns cross-route state and the route table.
// The visit counter is hoisted here so the mount-time visit POST fires once
// per app load; switching routes remounts pages without re-counting the
// visit (production total_views semantics unchanged, MEMORY D2/D4).
export function AppRoutes() {
  // Captured once at app load so tab switches never change the tracked URL.
  const [targetUrl] = useState(() => window.location.href);
  const counter = useClickCounter({
    endpointUrl: import.meta.env.VITE_VISIT_COUNTER_URL,
    targetUrl,
    installId: getInstallId(),
  });

  return (
    <Routes>
      <Route path="/" element={<FirstAidPage counter={counter} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
