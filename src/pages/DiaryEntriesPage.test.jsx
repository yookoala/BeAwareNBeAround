import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';
import { listEntries } from '../services/diaryEntries';

vi.mock('../services/diaryEntries', () => ({
  addEntry: vi.fn(async (input) => ({ id: 'stub-entry', createdAt: '', updatedAt: '', ...input })),
  getEntry: vi.fn(async () => undefined),
  updateEntry: vi.fn(async () => undefined),
  deleteEntry: vi.fn(async () => undefined),
  listEntries: vi.fn(async () => []),
  listRecent: vi.fn(async () => []),
}));

function Location() { const { pathname } = useLocation(); return <output data-testid="location">{pathname}</output>; }
function renderApp(path = '/diary/entries', locale = 'zh-HK') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={[path]}><Location /><AppRoutes /></MemoryRouter></I18nProvider>);
}

// Stored entries newest-first with strictly descending unique times, so a
// page boundary is always identifiable.
function storedEntry(i) {
  const hour = 23 - Math.floor(i / 60);
  const minute = 59 - (i % 60);
  return {
    id: `e${String(i).padStart(3, '0')}`,
    type: 'seizure',
    time: `2026-10-01T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    createdAt: '',
    updatedAt: '',
    data: { severity: 'minor', pattern: 'single', clusterCount: 2, auras: [], triggers: [], notes: `entry ${i}` },
  };
}
const allEntries = (count) => Array.from({ length: count }, (_, i) => storedEntry(i));

function mockStoredRows(rows) {
  listEntries.mockImplementation(({ before }) => {
    const start = before ? rows.findIndex((row) => row.id === before[1]) + 1 : 0;
    return Promise.resolve(rows.slice(start, start + 25));
  });
}

beforeEach(() => {
  listEntries.mockReset();
});

test('renders the first 25 of 60 entries and pages in the next 25 on sentinel intersection', async () => {
  mockStoredRows(allEntries(60));
  const { container } = renderApp('/diary/entries', 'en');

  await screen.findByText('2026-10-01 23:35'); // 25th card (entry 24)
  expect(container.querySelectorAll('.recent-entry-card')).toHaveLength(25);
  expect(container.querySelector('.entries-sentinel')).not.toBeNull();
  expect(container.querySelector('.entries-end')).toBeNull();

  await act(async () => {
    window.__triggerIntersection(true);
  });
  expect(container.querySelectorAll('.recent-entry-card')).toHaveLength(50);
  // The cursor must be the [time, id] of the last rendered card (entry 24).
  expect(listEntries.mock.calls[1][0].before).toEqual([storedEntry(24).time, 'e024']);

  await act(async () => {
    window.__triggerIntersection(true);
  });
  expect(container.querySelectorAll('.recent-entry-card')).toHaveLength(60);
  expect(listEntries.mock.calls[2][0].before).toEqual([storedEntry(49).time, 'e049']);
  expect(container.querySelector('.entries-sentinel')).toBeNull();
  expect(container.querySelector('.entries-end')).not.toBeNull();
  expect(listEntries).toHaveBeenCalledTimes(3);
});

test('a short page renders everything immediately with the end marker and no sentinel', async () => {
  mockStoredRows(allEntries(10));
  const { container } = renderApp('/diary/entries', 'en');

  await screen.findByText('2026-10-01 23:50'); // 10th card (entry 9)
  expect(container.querySelectorAll('.recent-entry-card')).toHaveLength(10);
  expect(container.querySelector('.entries-sentinel')).toBeNull();
  expect(container.querySelector('.entries-end')).not.toBeNull();
  expect(listEntries).toHaveBeenCalledTimes(1);
});

test('shows the empty state when nothing is stored', async () => {
  listEntries.mockResolvedValue([]);
  const { container } = renderApp('/diary/entries', 'zh-HK');
  expect(await screen.findByText('尚無記錄。已儲存的記錄會顯示在這裡。')).toBeInTheDocument();
  expect(container.querySelector('.recent-entry-card')).toBeNull();
  expect(container.querySelector('.entries-end')).toBeNull();
});

test('a failed load shows the records-unavailable line, not the empty state', async () => {
  listEntries.mockRejectedValue(new Error('storage unavailable'));
  const { container } = renderApp('/diary/entries', 'zh-HK');
  expect(await screen.findByText('無法讀取記錄 — 此裝置暫時無法開啟日記儲存空間。')).toBeInTheDocument();
  expect(container.querySelector('.recent-empty')).toBeNull();
});

test('intersections while a page is in flight do not fire extra fetches', async () => {
  const rows = allEntries(60);
  let resolveSecond;
  listEntries
    .mockResolvedValueOnce(rows.slice(0, 25))
    .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
  const { container } = renderApp('/diary/entries', 'en');
  await screen.findByText('2026-10-01 23:35');

  await act(async () => {
    window.__triggerIntersection(true);
  });
  window.__triggerIntersection(true);
  await act(async () => {
    await Promise.resolve();
  });
  expect(listEntries).toHaveBeenCalledTimes(2);

  await act(async () => {
    resolveSecond(rows.slice(25, 50));
  });
  expect(container.querySelectorAll('.recent-entry-card')).toHaveLength(50);
});

test('back button returns to /diary with vt-slide-out-right', async () => {
  mockStoredRows(allEntries(3));
  let finishTransition;
  document.startViewTransition = vi.fn((callback) => {
    callback();
    return { finished: new Promise((resolve) => { finishTransition = resolve; }) };
  });
  try {
    renderApp('/diary/entries', 'zh-HK');
    await screen.findByText('全部記錄');
    fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
    expect(document.startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveClass('vt-slide-out-right');
    expect(screen.getByTestId('location')).toHaveTextContent('/diary');
    await act(async () => {
      finishTransition();
    });
    expect(document.documentElement).not.toHaveClass('vt-slide-out-right');
  } finally {
    delete document.startViewTransition;
  }
});
