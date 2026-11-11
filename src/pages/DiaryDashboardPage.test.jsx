import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';
import { listRecent } from '../services/diaryEntries';

vi.mock('../services/diaryEntries', () => ({
  addEntry: vi.fn(async (input) => ({ id: 'stub-entry', createdAt: '', updatedAt: '', ...input })),
  getEntry: vi.fn(async () => undefined),
  updateEntry: vi.fn(async () => undefined),
  deleteEntry: vi.fn(async () => undefined),
  listEntries: vi.fn(async () => []),
  listRecent: vi.fn(async () => []),
}));

function Location() { const { pathname } = useLocation(); return <div data-testid="location">{pathname}</div>; }
function renderApp(path = '/diary', locale = 'zh-HK') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={[path]}><Location /><AppRoutes /></MemoryRouter></I18nProvider>);
}

// Stored entries as the service returns them: newest first, time as the
// datetime-local wall-clock string.
const fiveEntries = () => [
  { id: 'e1', type: 'seizure', time: '2026-09-15T16:00', createdAt: '', updatedAt: '', data: { severity: 'minor', pattern: 'cluster', clusterCount: 3, auras: ['visual'], triggers: ['stress'], notes: '' } },
  { id: 'e2', type: 'headache', time: '2026-09-14T21:15', createdAt: '', updatedAt: '', data: { severity: 'major', pattern: 'single', clusterCount: 2, auras: [], triggers: [], notes: '' } },
  { id: 'e3', type: 'sideEffects', time: '2026-09-14T08:00', createdAt: '', updatedAt: '', data: { selected: [{ id: 'drowsiness' }, { id: 'tremor' }], notes: '' } },
  { id: 'e4', type: 'health', time: '2026-09-13T19:30', createdAt: '', updatedAt: '', data: { selectedTags: ['period', 'urti'], customItems: ['高強度訓練'], notes: '' } },
  { id: 'e5', type: 'sideEffects', time: '2026-09-10T11:00', createdAt: '', updatedAt: '', data: { selected: [{ id: 'custom-1', label: '視力模糊' }], notes: '' } },
];

beforeEach(() => {
  listRecent.mockReset();
  listRecent.mockResolvedValue([]);
});

test('renders the five newest stored entries newest-first, with icons, titles, times and generated summaries', async () => {
  listRecent.mockResolvedValueOnce(fiveEntries());
  const { container } = renderApp();

  expect(screen.getByRole('link', { name: /腦癎錦囊/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '日記' })).toHaveAttribute('aria-current', 'page');
  expect(container.querySelector('.official-banner, #appMode, .first-aid-banner, .action-layout, #stateModal')).toBeNull();
  expect(screen.getByText('近期記錄')).toBeInTheDocument();

  await screen.findByText('2026-09-15 16:00');
  const cards = container.querySelectorAll('.recent-entries-list .recent-entry-card');
  expect(cards).toHaveLength(5);
  expect(cards[0]).toHaveTextContent('⚡');
  expect(cards[0]).toHaveTextContent('腦癇記錄');
  expect(cards[0]).toHaveTextContent('小發作 · 叢集 / 連續多次 ×3');
  expect(cards[1]).toHaveTextContent('2026-09-14 21:15');
  expect(cards[1]).toHaveTextContent('頭痛記錄');
  expect(cards[1]).toHaveTextContent('劇烈頭痛 · 單次頭痛');
  expect(cards[2]).toHaveTextContent('2026-09-14 08:00');
  expect(cards[2]).toHaveTextContent('副作用');
  expect(cards[2]).toHaveTextContent('嗜睡/疲倦 · 手部震顫');
  expect(cards[3]).toHaveTextContent('2026-09-13 19:30');
  expect(cards[3]).toHaveTextContent('生理及健康');
  expect(cards[3]).toHaveTextContent('女性生理期 · 傷風感冒 (URTI) (+1 項)');
  expect(cards[4]).toHaveTextContent('2026-09-10 11:00');
  expect(cards[4]).toHaveTextContent('視力模糊');
  expect(screen.getByText('發作/頭痛')).toBeInTheDocument();
  expect(screen.getByText('(選填) 建議填寫綜合診斷資料、發作類型、腦電圖等數據，有助於為您的主診醫生生成更精準完整的 PDF 報告。')).toBeInTheDocument();
});

test.each([
  ['zh-CN', '发作/头痛', '近期记录', '小发作 · 丛集 / 连续多次 ×3', '嗜睡/疲倦 · 手部震颤'],
  ['en', 'Seizure/Headache', 'Recent entries', 'Minor seizure · Cluster / repeated seizures ×3', 'Drowsiness/fatigue · Hand tremor'],
])('localizes the legend and generated summaries in %s', async (locale, legend, recentHeading, firstSummary, thirdSummary) => {
  listRecent.mockResolvedValueOnce(fiveEntries());
  renderApp('/diary', locale);
  expect(screen.getByText(legend)).toBeInTheDocument();
  expect(screen.getByText(recentHeading)).toBeInTheDocument();
  expect(await screen.findByText(firstSummary)).toBeInTheDocument();
  expect(screen.getByText(thirdSummary)).toBeInTheDocument();
});

test('renders neither cards nor the empty state while the load is pending', () => {
  listRecent.mockReturnValueOnce(new Promise(() => {}));
  const { container } = renderApp();
  expect(container.querySelectorAll('.recent-entry-card')).toHaveLength(0);
  expect(container.querySelector('.recent-entries-list')).toBeNull();
  expect(container.querySelector('.recent-empty')).toBeNull();
  expect(container.querySelector('.recent-records-unavailable')).toBeNull();
  expect(container.querySelector('.see-all-btn')).toBeNull();
});

test('shows the empty state with the full-list control when nothing is stored', async () => {
  const { container } = renderApp();
  expect(await screen.findByText('尚無記錄 — 點擊右下角 ✏️ 按鈕開始記錄。')).toBeInTheDocument();
  expect(container.querySelector('.recent-entries-list')).toBeNull();
  fireEvent.click(container.querySelector('.see-all-btn'));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/entries');
});

test('renders the full-list control below a stored list and navigates to /diary/entries', async () => {
  listRecent.mockResolvedValueOnce(fiveEntries());
  const { container } = renderApp();
  await screen.findByText('2026-09-15 16:00');
  expect(container.querySelector('.recent-entries-list .see-all-btn')).toBeNull();
  fireEvent.click(container.querySelector('.see-all-btn'));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/entries');
});

test('tapping a recent card opens its detail view', async () => {
  listRecent.mockResolvedValueOnce(fiveEntries());
  const { container } = renderApp();
  await screen.findByText('2026-09-15 16:00');

  const cards = container.querySelectorAll('.recent-entry-card');
  // Card semantics are buttons, so keyboard users can Tab to them and press Enter.
  expect(cards[0].tagName).toBe('BUTTON');
  fireEvent.click(cards[0]);
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/entry/e1');
});

test('a failed load shows the records-unavailable line, not the empty state', async () => {
  listRecent.mockRejectedValueOnce(new Error('storage unavailable'));
  const { container } = renderApp('/diary', 'en');
  expect(await screen.findByText('Records unavailable — this device could not open its diary storage.')).toBeInTheDocument();
  expect(container.querySelector('.recent-empty')).toBeNull();
  expect(container.querySelector('.recent-entries-list')).toBeNull();
});

test('switches calendar views and closes monthly modal with Escape', () => {
  const { container } = renderApp();
  expect(container.querySelector('#cal-past-7')).toBeVisible();
  expect(container.querySelector('#cal-this-week')).not.toBeVisible();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'thisWeek' } });
  expect(container.querySelector('#cal-this-week')).toBeVisible();
  expect(container.querySelector('#cal-past-7')).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /完整月曆/ }));
  expect(screen.getByRole('heading', { name: '2026年 9月 記錄' })).toBeVisible();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('heading', { name: '2026年 9月 記錄' })).not.toBeInTheDocument();
});

test.each([
  ['#fabRecord', '/diary/event'],
  ['.profile-card', '/diary/profile'],
  ['[data-report="level-a"]', '/diary/report/level-a'],
  ['[data-report="level-b"]', '/diary/report/level-b'],
])('%s navigates to %s', (selector, destination) => {
  const { container } = renderApp();
  fireEvent.click(container.querySelector(selector));
  expect(screen.getByTestId('location')).toHaveTextContent(destination);
});

test('opening event menu via FAB uses document.startViewTransition with vt-slide-in-right', async () => {
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
    const { container } = renderApp();
    fireEvent.click(container.querySelector('#fabRecord'));
    expect(document.startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveClass('vt-slide-in-right');
    expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
    await act(async () => {
      finishTransition();
    });
    expect(document.documentElement).not.toHaveClass('vt-slide-in-right');
  } finally {
    delete document.startViewTransition;
  }
});

test('FAB exists only on the diary dashboard and uses a pen icon', () => {
  const { container: diaryContainer } = renderApp('/diary');
  expect(diaryContainer.querySelector('#fabRecord svg')).not.toBeNull();
  expect(diaryContainer.querySelector('#fabRecord')).not.toHaveTextContent('🔴');
  const { container } = renderApp('/');
  expect(container.querySelector('#fabRecord')).toBeNull();
});

test('close button dismisses monthly dialog and the dashboard body class is removed on exit', () => {
  const { unmount } = renderApp();
  expect(document.body).toHaveClass('page-dashboard');
  fireEvent.click(screen.getByRole('button', { name: /完整月曆/ }));
  fireEvent.click(screen.getByRole('button', { name: '關閉' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  unmount();
  expect(document.body).not.toHaveClass('page-dashboard');
});

test.each([
  ['zh-CN', '(选填) 建议填写综合诊断资料、发作类型、脑电图等数据，有助于为您的主诊医生生成更精准完整的 PDF 报告。'],
  ['en', '(Optional) Add comprehensive diagnostic information, seizure types, EEG and other data to help generate a more accurate and complete PDF report for your doctor.'],
])('localizes the unified profile description in %s', (locale, description) => {
  renderApp('/diary', locale);
  expect(screen.getByText(description)).toBeInTheDocument();
});

test('keeps focus in monthly modal and restores the trigger', () => {
  renderApp();
  const trigger = screen.getByRole('button', { name: /完整月曆/ });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog', { name: '2026年 9月 記錄' });
  const close = screen.getByRole('button', { name: '關閉' });
  expect(close).toHaveFocus();
  const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  close.dispatchEvent(tab);
  expect(tab.defaultPrevented).toBe(true);
  expect(dialog).toContainElement(document.activeElement);
  const reverseTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
  close.dispatchEvent(reverseTab);
  expect(reverseTab.defaultPrevented).toBe(true);
  expect(dialog).toContainElement(document.activeElement);
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(trigger).toHaveFocus();
});

test('announces medication, event and health indicators for weekly and monthly days', () => {
  const { container } = renderApp('/diary', 'en');
  const weeklyDays = container.querySelectorAll('#cal-past-7 .calendar-day');
  expect(weeklyDays[2]).toHaveAccessibleName('Thu 10, Taken: 2, Missed: 1');
  expect(weeklyDays[3]).toHaveAccessibleName('Fri 11, Taken: 3, Seizure/Headache');
  expect(weeklyDays[6]).toHaveAccessibleName('Mon 14, Taken: 1, Not recorded: 2, Period, Illness/Stress');
  fireEvent.click(screen.getByRole('button', { name: /Full calendar/ }));
  const days = container.querySelectorAll('#monthlyModal .month-day:not(.empty)');
  expect(days[2]).toHaveAccessibleName('3, Taken: 2, Missed: 1');
  expect(days[3]).toHaveAccessibleName('4, Taken: 2, Seizure/Headache');
  expect(days[12]).toHaveAccessibleName('13, Taken: 2, Period, Illness/Stress');
  expect(days[14]).not.toHaveAttribute('aria-label');
});

test('localizes day indicator descriptions in Chinese', () => {
  const { container } = renderApp();
  expect(container.querySelectorAll('#cal-past-7 .calendar-day')[2]).toHaveAccessibleName('四 10, 已服: 2, 漏服: 1');
});

test('localizes day indicator descriptions in simplified Chinese', () => {
  const { container } = renderApp('/diary', 'zh-CN');
  expect(container.querySelectorAll('#cal-past-7 .calendar-day')[6]).toHaveAccessibleName('一 14, 已服: 1, 未记录: 2, 生理期, 疾病/压力');
});
