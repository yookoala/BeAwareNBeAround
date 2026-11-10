import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';

function Location() { const { pathname } = useLocation(); return <output data-testid="location">{pathname}</output>; }
function renderApp(path = '/diary', locale = 'zh-HK') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={[path]}><Location /><AppRoutes /></MemoryRouter></I18nProvider>);
}

test('renders unified dashboard with recent 5 entries and without action-layout or stateModal', () => {
  const { container } = renderApp();
  expect(screen.getByRole('link', { name: /腦癎錦囊/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '日記' })).toHaveAttribute('aria-current', 'page');
  expect(container.querySelector('.official-banner, #appMode, .first-aid-banner, .action-layout, #stateModal')).toBeNull();
  expect(screen.getByText('近期記錄')).toBeInTheDocument();
  const cards = container.querySelectorAll('.recent-entries-list .recent-entry-card');
  expect(cards).toHaveLength(5);
  expect(cards[0]).toHaveTextContent('2026-09-15 16:00');
  expect(cards[0]).toHaveTextContent('腦癇記錄');
  expect(cards[1]).toHaveTextContent('2026-09-14 21:15');
  expect(cards[1]).toHaveTextContent('頭痛記錄');
  expect(cards[2]).toHaveTextContent('2026-09-14 08:00');
  expect(cards[2]).toHaveTextContent('服藥記錄');
  expect(cards[3]).toHaveTextContent('2026-09-13 19:30');
  expect(cards[3]).toHaveTextContent('生理及健康');
  expect(cards[4]).toHaveTextContent('2026-09-10 11:00');
  expect(cards[4]).toHaveTextContent('副作用');
  expect(screen.getByText('發作/頭痛')).toBeInTheDocument();
  expect(screen.getByText('(選填) 建議填寫綜合診斷資料、發作類型、腦電圖等數據，有助於為您的主診醫生生成更精準完整的 PDF 報告。')).toBeInTheDocument();
});

test.each([
  ['zh-CN', '发作/头痛', '近期记录', '小发作 (叢集 2 次) · 右手麻木'],
  ['en', 'Seizure/Headache', 'Recent entries', 'Minor seizure (cluster ×2) · Right hand numbness'],
])('localizes the legend and recent entries in %s', (locale, legend, recentHeading, firstSummary) => {
  renderApp('/diary', locale);
  expect(screen.getByText(legend)).toBeInTheDocument();
  expect(screen.getByText(recentHeading)).toBeInTheDocument();
  expect(screen.getByText(firstSummary)).toBeInTheDocument();
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
