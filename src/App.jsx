import { useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { activateLocale, i18n } from './i18n/setup';
import { getInstallId } from './services/install';
import { useAutoHideChrome } from './hooks/useAutoHideChrome';
import { useClickCounter } from './hooks/useClickCounter';
import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import FirstAidPage from './pages/FirstAidPage';
import DiaryDashboardPage from './pages/DiaryDashboardPage';
import EventLogPage from './pages/EventLogPage';

// App shell (PLAN06 M13): owns the shared chrome (header + bottom nav),
// the route table, and cross-route state. The visit counter is hoisted
// here so the mount-time visit POST fires once per app load; switching
// routes remounts pages without re-counting the visit (production
// total_views semantics unchanged, MEMORY D2/D4). Locale state lives here
// until the useLocale hook lands (M15).
export function AppRoutes() {
  const navigate = useNavigate();
  const chromeHidden = useAutoHideChrome();
  // Captured once at app load so tab switches never change the tracked URL.
  const [targetUrl] = useState(() => window.location.href);
  // Seeded from the activated catalog so shell state and catalogs can
  // never disagree (a same-value setLanguage would skip the re-render).
  const [language, setLanguage] = useState(() => i18n.locale);
  const counter = useClickCounter({
    endpointUrl: import.meta.env.VITE_VISIT_COUNTER_URL,
    targetUrl,
    installId: getInstallId(),
  });

  function changeLanguage(nextLanguage) {
    activateLocale(nextLanguage);
    setLanguage(nextLanguage);
  }

  function navigateHome() {
    navigate('/');
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <main>
      <AppHeader
        language={language}
        onLanguageChange={changeLanguage}
        onNavigateHome={navigateHome}
        hidden={chromeHidden}
      />
      <Routes>
        <Route path="/" element={<FirstAidPage counter={counter} language={language} />} />
        <Route path="/diary" element={<DiaryDashboardPage />} />
        <Route path="/diary/event-log" element={<EventLogPage />} />
      </Routes>
      <BottomNav hidden={chromeHidden} />
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
