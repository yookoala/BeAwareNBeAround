import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AppRoutes } from './App';
import { activateLocale, i18n } from './i18n/setup';

function stubCounter(initialTotal = 12544) {
  let total = initialTotal;
  const requests = [];
  const stub = vi.fn(async (input, init = {}) => {
    const url = String(input);
    const method = (init.method || 'GET').toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    requests.push({ url, method, body });
    if (method === 'POST' && body && body.action === 'click') {
      total += 1;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'success', metrics: { total_views: total, unique_views: total } }),
    };
  });
  vi.stubGlobal('fetch', stub);
  return { requests };
}

// Test-only navigation buttons standing in for the future BottomNav tabs.
function NavHarness() {
  const navigate = useNavigate();
  return (
    <div>
      <button onClick={() => navigate('/other')}>go-other</button>
      <button onClick={() => navigate('/')}>go-home</button>
    </div>
  );
}

function renderShell(initialEntries = ['/'], { harness = false } = {}) {
  const counter = stubCounter();
  activateLocale('zh-HK');
  return {
    counter,
    ...render(
      <I18nProvider i18n={i18n}>
        <MemoryRouter initialEntries={initialEntries}>
          {harness && <NavHarness />}
          <AppRoutes />
        </MemoryRouter>
      </I18nProvider>,
    ),
  };
}

// A visit POST is the mount-time analytics POST: log:true without an action.
const visitPosts = (requests) =>
  requests.filter((request) => request.method === 'POST' && request.body && request.body.log && !request.body.action);

test('renders the first-aid page at the / route', async () => {
  renderShell(['/']);

  expect(await screen.findByRole('heading', { name: "Be Aware n' Be Around" })).toBeInTheDocument();
});

test('logs exactly one visit POST per app load across route changes', async () => {
  const { counter } = renderShell(['/'], { harness: true });

  expect(await screen.findByRole('heading', { name: "Be Aware n' Be Around" })).toBeInTheDocument();
  expect(visitPosts(counter.requests)).toHaveLength(1);

  // Leave and return to the first-aid route (stand-in for tab switches).
  fireEvent.click(screen.getByRole('button', { name: 'go-other' }));
  expect(screen.queryByRole('heading', { name: "Be Aware n' Be Around" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'go-home' }));
  expect(await screen.findByRole('heading', { name: "Be Aware n' Be Around" })).toBeInTheDocument();

  // The counter is hoisted to the shell: remounting the page must not
  // re-POST the visit (PLAN06 decision 9).
  expect(visitPosts(counter.requests)).toHaveLength(1);
});

test('renders the bottom nav on every route with the active tab marked', async () => {
  renderShell(['/']);

  const firstAidTab = await screen.findByRole('link', { name: '指南' });
  const diaryTab = screen.getByRole('link', { name: '日記' });
  expect(firstAidTab).toHaveAttribute('aria-current', 'page');
  expect(diaryTab).not.toHaveAttribute('aria-current');
  expect(firstAidTab.querySelector('svg')).toBeInTheDocument();
  expect(diaryTab.querySelector('svg')).toBeInTheDocument();
});

test('switches to the diary placeholder and back via the bottom nav without re-counting the visit', async () => {
  const { counter } = renderShell(['/']);

  expect(await screen.findByRole('heading', { name: "Be Aware n' Be Around" })).toBeInTheDocument();
  expect(visitPosts(counter.requests)).toHaveLength(1);

  fireEvent.click(screen.getByRole('link', { name: '日記' }));
  expect(await screen.findByRole('heading', { name: '日記功能即將推出' })).toBeInTheDocument();
  expect(screen.getByText('日記功能正在開發中，敬請期待。')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '日記' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: '指南' })).not.toHaveAttribute('aria-current');

  fireEvent.click(screen.getByRole('link', { name: '指南' }));
  expect(await screen.findByRole('heading', { name: "Be Aware n' Be Around" })).toBeInTheDocument();
  expect(visitPosts(counter.requests)).toHaveLength(1);
});

test('renders the shared app header on the diary route too and navigates Home when clicking the brand link', async () => {
  renderShell(['/diary']);

  expect(await screen.findByRole('heading', { name: '日記功能即將推出' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '語言' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('link', { name: /腦癎錦囊/ }));
  expect(await screen.findByRole('heading', { name: "Be Aware n' Be Around" })).toBeInTheDocument();
});

test('localizes the bottom tab labels when the app language changes', async () => {
  renderShell(['/']);

  fireEvent.click(screen.getByRole('button', { name: '語言' }));
  fireEvent.click(screen.getByRole('menuitem', { name: '简体' }));
  expect(screen.getByRole('link', { name: '指南' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '日记' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '语言' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'EN' }));
  expect(screen.getByRole('link', { name: 'First Aid' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Diary' })).toBeInTheDocument();
});
