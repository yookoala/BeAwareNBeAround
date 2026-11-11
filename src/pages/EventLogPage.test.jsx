import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';
import { addEntry, getEntry, updateEntry } from '../services/diaryEntries';

vi.mock('../services/diaryEntries', () => ({
  addEntry: vi.fn(async (input) => ({ id: 'stub-entry', createdAt: '', updatedAt: '', ...input })),
  getEntry: vi.fn(async () => undefined),
  updateEntry: vi.fn(async () => undefined),
  deleteEntry: vi.fn(async () => undefined),
  listEntries: vi.fn(async () => []),
  listRecent: vi.fn(async () => []),
}));

afterEach(() => {
  vi.useRealTimers();
});

// Pin the clock so the now-default datetime matches the historic fixture value.
function freezeNow() {
  vi.useFakeTimers({ now: new Date(2026, 8, 17, 17, 30) });
}

function Location() {
  const { pathname, search, state } = useLocation();
  return (
    <>
      <div data-testid="location">{`${pathname}${search}`}</div>
      <div data-testid="location-state">{JSON.stringify(state ?? null)}</div>
    </>
  );
}
function renderApp(locale = 'zh-HK', path = '/diary/event/seizure') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={[path]}><Location /><AppRoutes /></MemoryRouter></I18nProvider>);
}

test.each([
  ['zh-HK', '/diary/event/seizure', '← 返回', '腦癇記錄', '儲存'],
  ['zh-CN', '/diary/event/seizure', '← 返回', '癫痫记录', '保存'],
  ['en', '/diary/event/seizure', '← Back', 'Seizure record', 'Save'],
  ['zh-HK', '/diary/event/headache', '← 返回', '頭痛記錄', '儲存'],
  ['zh-CN', '/diary/event/headache', '← 返回', '头痛记录', '保存'],
  ['en', '/diary/event/headache', '← Back', 'Headache record', 'Save'],
])('replaces the main app header with the localized header bar in %s at %s', (locale, path, back, title, save) => {
  freezeNow();
  const { container } = renderApp(locale, path);
  const subheader = container.querySelector('.diary-subheader');
  expect(within(subheader).getByRole('button', { name: back })).toHaveAttribute('type', 'button');
  expect(within(subheader).getByText(title)).toBeVisible();
  expect(within(subheader).getByRole('button', { name: save })).toBeVisible();
  expect(container.querySelectorAll('header')).toHaveLength(1);
  expect(container.querySelector('.app-header')).toBeNull();
  expect(container.querySelector('.bottom-nav a[href="/diary"]')).toHaveAttribute('aria-current', 'page');
  expect(container.querySelector('input[type="datetime-local"]')).toHaveValue('2026-09-17T17:30');
});

test('back returns to /diary/event immediately when unchanged and cleans up the body class on unmount', () => {
  const { unmount } = renderApp();
  expect(document.body).toHaveClass('page-event-log');
  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
  unmount();
  expect(document.body).not.toHaveClass('page-event-log');
});

test('warns before leaving when form has unsaved changes, and allows staying or leaving', () => {
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: '小發作' }));
  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event/seizure');
  const dialog = screen.getByRole('dialog', { name: '尚未儲存' });
  expect(dialog).toBeVisible();
  expect(within(dialog).getByText('您有尚未儲存的更改，確定要離開嗎？')).toBeVisible();
  fireEvent.click(within(dialog).getByRole('button', { name: '繼續編輯' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event/seizure');

  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  fireEvent.click(screen.getByRole('button', { name: '確定離開' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
});

test('saving clears the dirty state so back navigates without warning', async () => {
  renderApp('en');
  fireEvent.change(screen.getByLabelText('Seizure description / notes'), { target: { value: 'Cluster after missed dose' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByRole('status');
  fireEvent.click(screen.getByRole('button', { name: '← Back' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
});

test('uses document.startViewTransition with vt-slide-out-right when returning to /diary/event', async () => {
  let finishTransition;
  document.startViewTransition = vi.fn((callback) => {
    callback();
    return {
      finished: new Promise((resolve) => {
        finishTransition = resolve;
      }),
    };
  });
  try {
    renderApp('en');
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(document.startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveClass('vt-slide-out-right');
    expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
    await act(async () => {
      finishTransition();
    });
    expect(document.documentElement).not.toHaveClass('vt-slide-out-right');
  } finally {
    delete document.startViewTransition;
  }
});

test('severity and pattern options toggle and the cluster counter has a floor and resets on seizure and headache routes', () => {
  freezeNow();
  const { container, unmount } = renderApp('zh-HK', '/diary/event/seizure');
  const minor = screen.getByRole('button', { name: '小發作' });
  fireEvent.click(minor);
  expect(minor).toHaveClass('active');
  expect(minor).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: '叢集 / 連續多次' }));
  const counter = container.querySelector('#cluster-counter');
  expect(counter).toBeVisible();
  const [decrease, increase] = within(counter).getAllByRole('button');
  fireEvent.click(decrease);
  expect(container.querySelector('#attack-count')).toHaveTextContent('2');
  fireEvent.click(increase);
  expect(container.querySelector('#attack-count')).toHaveTextContent('3');
  fireEvent.click(screen.getByRole('button', { name: '單次發作' }));
  expect(counter).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '叢集 / 連續多次' }));
  expect(container.querySelector('#attack-count')).toHaveTextContent('2');
  expect(decrease).toHaveAttribute('type', 'button');
  unmount();

  const { container: headacheContainer } = renderApp('zh-HK', '/diary/event/headache');
  expect(screen.getByLabelText('頭痛時間')).toHaveValue('2026-09-17T17:30');
  const mild = screen.getByRole('button', { name: '輕度/中度頭痛' });
  fireEvent.click(mild);
  expect(mild).toHaveClass('active');
  fireEvent.click(screen.getByRole('button', { name: '叢集 / 連續多次' }));
  expect(headacheContainer.querySelector('#cluster-counter')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '單次頭痛' }));
  expect(headacheContainer.querySelector('#cluster-counter')).not.toBeVisible();
});

test('aura and trigger selections survive language changes and no aura stays exclusive', () => {
  renderApp('zh-HK', '/diary/event/headache');
  fireEvent.click(screen.getByRole('button', { name: '無預兆' }));
  fireEvent.click(screen.getByRole('button', { name: '熬夜/睡眠不足' }));
  act(() => activateLocale('en'));
  const none = screen.getByRole('button', { name: 'No Aura' });
  expect(none).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Sleep deprivation' })).toHaveAttribute('aria-pressed', 'true');
  const visual = screen.getByRole('button', { name: 'Visual (e.g. flashing lights/hallucinations)' });
  fireEvent.click(visual);
  expect(none).toHaveAttribute('aria-pressed', 'false');
  expect(visual).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(none);
  expect(visual).toHaveAttribute('aria-pressed', 'false');
  expect(none).toHaveAttribute('aria-pressed', 'true');
});

test.each([['zh-HK', '儲存', '記錄已儲存！'], ['zh-CN', '保存', '记录已保存！'], ['en', 'Save', 'Entry saved!']])('announces save temporarily in %s', async (locale, save, message) => {
  renderApp(locale);
  vi.useFakeTimers();
  // act() flushes the async save handler and its render synchronously, so
  // the toast is present without waitFor polling (which deadlocks under fake
  // timers).
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: save }));
  });
  expect(screen.getByRole('status')).toHaveTextContent(message);
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  vi.useRealTimers();
});

test.each([
  ['zh-HK', '← 返回', '服藥記錄', '即將推出'],
  ['zh-CN', '← 返回', '服药记录', '即将推出'],
  ['en', '← Back', 'Medication record', 'Coming soon'],
])('renders the medication coming soon view at /diary/event/medication in %s', (locale, back, title, comingSoon) => {
  const { container } = renderApp(locale, '/diary/event/medication');
  expect(container.querySelector('.app-header')).toBeNull();
  const subheader = container.querySelector('.diary-subheader');
  expect(within(subheader).getByText(title)).toBeVisible();
  expect(screen.getByText(comingSoon)).toBeVisible();
  fireEvent.click(within(subheader).getByRole('button', { name: back }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
});

test('saving a seizure form stores one seizure entry with the full payload', async () => {
  freezeNow();
  renderApp('en');
  fireEvent.click(screen.getByRole('button', { name: 'Minor seizure' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cluster / repeated seizures' }));
  fireEvent.click(screen.getByRole('button', { name: 'Increase seizure count' }));
  fireEvent.click(screen.getByRole('button', { name: 'Visual (e.g. flashing lights/hallucinations)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Missed medication' }));
  fireEvent.change(screen.getByLabelText('Seizure description / notes'), { target: { value: 'left hand twitching' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  });

  expect(addEntry).toHaveBeenCalledTimes(1);
  expect(addEntry.mock.calls[0][0]).toEqual({
    type: 'seizure',
    time: '2026-09-17T17:30',
    data: {
      severity: 'minor',
      pattern: 'cluster',
      clusterCount: 3,
      auras: ['visual'],
      triggers: ['medication'],
      notes: 'left hand twitching',
    },
  });
});

test('saving the headache variant stores type headache with defaults', async () => {
  freezeNow();
  renderApp('en', '/diary/event/headache');
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  });

  expect(addEntry).toHaveBeenCalledTimes(1);
  expect(addEntry.mock.calls[0][0]).toEqual({
    type: 'headache',
    time: '2026-09-17T17:30',
    data: { severity: 'major', pattern: 'single', clusterCount: 2, auras: [], triggers: [], notes: '' },
  });
});

test('a failed save shows an error toast and keeps the unsaved-changes guard', async () => {
  addEntry.mockRejectedValueOnce(new Error('storage quota'));
  renderApp('en');
  fireEvent.change(screen.getByLabelText('Seizure description / notes'), { target: { value: 'unsavable notes' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Could not save the record. Storage is unavailable on this device.');
  fireEvent.click(screen.getByRole('button', { name: '← Back' }));
  expect(screen.getByRole('dialog', { name: 'Unsaved changes' })).toBeVisible();
});

// --- M19-006 edit mode ---

const storedSeizure = {
  id: 'e1',
  type: 'seizure',
  time: '2026-09-15T16:00',
  createdAt: '2026-09-15T15:59:00.000Z',
  updatedAt: '2026-09-15T15:59:00.000Z',
  data: { severity: 'minor', pattern: 'cluster', clusterCount: 3, auras: ['visual'], triggers: ['stress'], notes: 'left hand twitching' },
};

// The edit load resolves on the microtask queue; a flushed act() settles the
// form without waitFor polling (which stalls under the frozen clock).
async function settleEditLoad() {
  await act(async () => {
    await Promise.resolve();
  });
}

test('editing a stored seizure pre-fills every control', async () => {
  freezeNow();
  getEntry.mockResolvedValueOnce(storedSeizure);
  const { container } = renderApp('en', '/diary/event/seizure?edit=e1');
  await settleEditLoad();

  expect(screen.getByLabelText('Seizure time')).toHaveValue('2026-09-15T16:00');
  expect(screen.getByRole('button', { name: 'Minor seizure' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Cluster / repeated seizures' })).toHaveAttribute('aria-pressed', 'true');
  expect(container.querySelector('#attack-count')).toHaveTextContent('3');
  expect(screen.getByRole('button', { name: 'Visual (e.g. flashing lights/hallucinations)' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Stress/tension' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByLabelText('Seizure description / notes')).toHaveValue('left hand twitching');
});

test('saving an edited seizure updates the same entry and lands on the detail view with saved state', async () => {
  freezeNow();
  addEntry.mockClear();
  getEntry.mockResolvedValueOnce(storedSeizure);
  renderApp('en', '/diary/event/seizure?edit=e1');
  await settleEditLoad();

  fireEvent.change(screen.getByLabelText('Seizure description / notes'), { target: { value: 'updated notes' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await Promise.resolve();
  });

  expect(updateEntry).toHaveBeenCalledTimes(1);
  expect(updateEntry).toHaveBeenCalledWith('e1', {
    time: '2026-09-15T16:00',
    data: { severity: 'minor', pattern: 'cluster', clusterCount: 3, auras: ['visual'], triggers: ['stress'], notes: 'updated notes' },
  });
  expect(addEntry).not.toHaveBeenCalled();
  expect(screen.getByTestId('location').textContent).toBe('/diary/entry/e1');
  expect(screen.getByTestId('location-state')).toHaveTextContent('{"saved":true}');
  // The detail view (now mounted) hosts the saved toast, not the form.
  expect(screen.getByRole('status')).toHaveTextContent('Entry saved!');
});

test('an unknown edit id falls back to create-mode defaults and drops the edit param', async () => {
  freezeNow();
  addEntry.mockClear();
  renderApp('en', '/diary/event/seizure?edit=nope');
  await settleEditLoad();

  expect(screen.getByLabelText('Seizure time')).toHaveValue('2026-09-17T17:30');
  expect(screen.getByTestId('location').textContent).toBe('/diary/event/seizure');

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await Promise.resolve();
  });
  expect(addEntry).toHaveBeenCalledTimes(1);
  expect(updateEntry).not.toHaveBeenCalled();
});

test('clean back in edit mode returns to the detail view, not the event menu', async () => {
  getEntry.mockResolvedValueOnce(storedSeizure);
  renderApp('en', '/diary/event/seizure?edit=e1');
  await settleEditLoad();

  fireEvent.click(screen.getByRole('button', { name: '← Back' }));
  expect(screen.getByTestId('location').textContent).toBe('/diary/entry/e1');
});

test('the unsaved-changes guard in edit mode leaves to the detail view', async () => {
  getEntry.mockResolvedValueOnce(storedSeizure);
  renderApp('en', '/diary/event/seizure?edit=e1');
  await settleEditLoad();

  fireEvent.click(screen.getByRole('button', { name: 'Major seizure' }));
  fireEvent.click(screen.getByRole('button', { name: '← Back' }));
  expect(screen.getByRole('dialog', { name: 'Unsaved changes' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
  expect(screen.getByTestId('location').textContent).toBe('/diary/entry/e1');
});
