import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';
import { deleteEntry, getEntry } from '../services/diaryEntries';

vi.mock('../services/diaryEntries', () => ({
  addEntry: vi.fn(async (input) => ({ id: 'stub-entry', createdAt: '', updatedAt: '', ...input })),
  getEntry: vi.fn(async () => undefined),
  updateEntry: vi.fn(async () => undefined),
  deleteEntry: vi.fn(async () => true),
  listEntries: vi.fn(async () => []),
  listRecent: vi.fn(async () => []),
}));

function Location() {
  const { pathname, search, state } = useLocation();
  return (
    <>
      <div data-testid="location">{`${pathname}${search}`}</div>
      <div data-testid="location-state">{JSON.stringify(state ?? null)}</div>
    </>
  );
}

// initialEntries mirrors real navigation: the detail route is reached FROM a
// list page, so goBack tests can assert where `← Back` lands.
function renderDetail({ path = '/diary/entry/e1', locale = 'en', state, from = '/diary/entries' } = {}) {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(
    <I18nProvider i18n={i18n}>
      <MemoryRouter initialEntries={[from, { pathname: path, state }]}>
        <Location />
        <AppRoutes />
      </MemoryRouter>
    </I18nProvider>,
  );
}

const entries = {
  seizure: {
    id: 'e1',
    type: 'seizure',
    time: '2026-09-15T16:00',
    createdAt: '',
    updatedAt: '',
    data: { severity: 'minor', pattern: 'cluster', clusterCount: 3, auras: ['visual', 'sensory'], triggers: ['stress'], notes: 'left hand twitching' },
  },
  headache: {
    id: 'h1',
    type: 'headache',
    time: '2026-09-14T21:15',
    createdAt: '',
    updatedAt: '',
    data: { severity: 'major', pattern: 'single', clusterCount: 2, auras: [], triggers: [], notes: 'throbbing after poor sleep' },
  },
  sideEffects: {
    id: 's1',
    type: 'sideEffects',
    time: '2026-09-14T08:00',
    createdAt: '',
    updatedAt: '',
    data: { selected: [{ id: 'drowsiness' }, { id: 'tremor' }, { id: 'custom-1', label: 'Blurred vision' }], notes: 'appeared two hours after dosing' },
  },
  health: {
    id: 'h2',
    type: 'health',
    time: '2026-09-13T19:30',
    createdAt: '',
    updatedAt: '',
    data: { selectedTags: ['period', 'urti'], customItems: ['Intense training'], notes: 'day 1 of cycle' },
  },
};

beforeEach(() => {
  getEntry.mockReset();
  getEntry.mockResolvedValue(undefined);
  deleteEntry.mockReset();
  deleteEntry.mockResolvedValue(true);
});

test('renders a stored seizure entry read-only with every recorded field', async () => {
  getEntry.mockResolvedValueOnce(entries.seizure);
  const { container } = renderDetail();

  expect(await screen.findByText('2026-09-15 16:00')).toBeInTheDocument();
  expect(screen.getByText('Seizure record')).toBeInTheDocument();
  expect(screen.getByText('Record time')).toBeInTheDocument();
  expect(screen.getByText('Seizure severity and pattern')).toBeInTheDocument();
  expect(screen.getByText('Minor seizure')).toBeInTheDocument();
  expect(screen.getByText('Cluster / repeated seizures')).toBeInTheDocument();
  expect(screen.getByText('×3')).toBeInTheDocument();
  expect(screen.getByText('Auras')).toBeInTheDocument();
  expect(screen.getByText('Visual (e.g. flashing lights/hallucinations)')).toBeInTheDocument();
  expect(screen.getByText('Physical sensations (e.g. numbness/tingling)')).toBeInTheDocument();
  expect(screen.getByText('Triggers')).toBeInTheDocument();
  expect(screen.getByText('Stress/tension')).toBeInTheDocument();
  expect(screen.getByText('Seizure description / notes')).toBeInTheDocument();
  expect(screen.getByText('left hand twitching')).toBeInTheDocument();

  // Read-only view: no editable controls, but Edit and Delete actions exist.
  expect(container.querySelector('input, textarea, select')).toBeNull();
  expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Delete entry' })).toBeInTheDocument();
});

test('renders localized severity and pattern labels in zh-HK', async () => {
  getEntry.mockResolvedValueOnce(entries.seizure);
  renderDetail({ locale: 'zh-HK' });

  expect(await screen.findByText('腦癇記錄')).toBeInTheDocument();
  expect(screen.getByText('小發作')).toBeInTheDocument();
  expect(screen.getByText('叢集 / 連續多次')).toBeInTheDocument();
  expect(screen.getByText('×3')).toBeInTheDocument();
});

test('renders the headache variant without cluster or tag sections', async () => {
  getEntry.mockResolvedValueOnce(entries.headache);
  renderDetail({ path: '/diary/entry/h1' });

  expect(await screen.findByText('Headache record')).toBeInTheDocument();
  expect(screen.getByText('Severe headache')).toBeInTheDocument();
  expect(screen.getByText('Single headache')).toBeInTheDocument();
  expect(screen.queryByText('×2')).not.toBeInTheDocument();
  expect(screen.queryByText('Auras')).not.toBeInTheDocument();
  expect(screen.queryByText('Triggers')).not.toBeInTheDocument();
  expect(screen.getByText('throbbing after poor sleep')).toBeInTheDocument();
});

test('renders side-effect chips including stored custom labels', async () => {
  getEntry.mockResolvedValueOnce(entries.sideEffects);
  renderDetail({ path: '/diary/entry/s1' });

  expect(await screen.findByText('Side effects recorded')).toBeInTheDocument();
  expect(screen.getByText('Drowsiness/fatigue')).toBeInTheDocument();
  expect(screen.getByText('Hand tremor')).toBeInTheDocument();
  expect(screen.getByText('Blurred vision')).toBeInTheDocument();
  expect(screen.getByText('appeared two hours after dosing')).toBeInTheDocument();
});

test('renders health chips from tag ids and custom item texts', async () => {
  getEntry.mockResolvedValueOnce(entries.health);
  renderDetail({ path: '/diary/entry/h2' });

  expect(await screen.findByText('Health conditions recorded')).toBeInTheDocument();
  expect(screen.getByText('Menstrual period')).toBeInTheDocument();
  expect(screen.getByText('Cold (URTI)')).toBeInTheDocument();
  expect(screen.getByText('Intense training')).toBeInTheDocument();
  expect(screen.getByText('day 1 of cycle')).toBeInTheDocument();
});

test('an unknown id shows the not-found line with only a back control', async () => {
  const { container } = renderDetail();

  expect(await screen.findByText('Record not found on this device.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '← Back' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Delete entry' })).not.toBeInTheDocument();
  expect(container.querySelector('input, textarea, select')).toBeNull();
});

test('a storage failure shows the records-unavailable line, not not-found', async () => {
  getEntry.mockRejectedValueOnce(new Error('storage unavailable'));
  renderDetail();

  expect(await screen.findByText('Records unavailable — this device could not open its diary storage.')).toBeInTheDocument();
  expect(screen.queryByText('Record not found on this device.')).not.toBeInTheDocument();
});

test.each([
  ['seizure', '/diary/event/seizure'],
  ['headache', '/diary/event/headache'],
  ['sideEffects', '/diary/event/side-effects'],
  ['health', '/diary/event/health'],
])('Edit opens the %s form with edit=<id> via a slide-in transition', async (type, route) => {
  getEntry.mockResolvedValueOnce(entries[type]);
  let finishTransition;
  document.startViewTransition = vi.fn((callback) => {
    callback();
    return { finished: new Promise((resolve) => { finishTransition = resolve; }) };
  });
  try {
    const entry = entries[type];
    renderDetail({ path: `/diary/entry/${entry.id}` });
    await screen.findByRole('button', { name: 'Edit' });
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(document.startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveClass('vt-slide-in-right');
    expect(screen.getByTestId('location')).toHaveTextContent(`${route}?edit=${entry.id}`);

    await act(async () => {
      finishTransition();
    });
    expect(document.documentElement).not.toHaveClass('vt-slide-in-right');
  } finally {
    delete document.startViewTransition;
  }
});

test('← Back returns to the page the detail was opened from', async () => {
  getEntry.mockResolvedValueOnce(entries.seizure);
  renderDetail({ from: '/diary/entries' });
  await screen.findByText('2026-09-15 16:00');

  fireEvent.click(screen.getByRole('button', { name: '← Back' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/entries');
});

test('delete confirmation: Escape and Cancel keep the entry; confirm deletes and returns to the list', async () => {
  getEntry.mockResolvedValueOnce(entries.seizure);
  renderDetail();
  await screen.findByRole('button', { name: 'Delete entry' });

  fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }));
  const dialog = screen.getByRole('dialog');
  // M19-008: a modal <dialog> with the two choices as its only controls, and
  // Cancel focused so the destructive action is never the keyboard default.
  expect(dialog.tagName).toBe('DIALOG');
  expect(dialog.open).toBe(true);
  expect(within(dialog).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
  expect(screen.getByText('Delete entry?')).toBeInTheDocument();
  expect(within(dialog).getByText('Are you sure you want to delete this entry? It will be permanently removed from this device.')).toBeInTheDocument();

  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(deleteEntry).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(deleteEntry).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }));
  let finishTransition;
  document.startViewTransition = vi.fn((callback) => {
    callback();
    return { finished: new Promise((resolve) => { finishTransition = resolve; }) };
  });
  try {
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    await act(async () => {
      // deleteEntry resolves on the microtask queue; its .then is what calls
      // the mocked startViewTransition, so flush before finishing it.
      await Promise.resolve();
      finishTransition();
    });
  } finally {
    delete document.startViewTransition;
  }

  expect(deleteEntry).toHaveBeenCalledTimes(1);
  expect(deleteEntry).toHaveBeenCalledWith('e1');
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/entries');
  expect(screen.getByTestId('location-state')).toHaveTextContent('{"deleted":true}');
});

test('mounting with navigation state { saved: true } shows the saved toast for 2 s', () => {
  getEntry.mockResolvedValueOnce(entries.seizure);
  vi.useFakeTimers();
  try {
    renderDetail({ state: { saved: true } });
    expect(screen.getByRole('status')).toHaveTextContent('Entry saved!');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
