import { fireEvent, render, screen } from '@testing-library/react';
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

test('renders unified dashboard in shared shell without legacy chrome', () => {
  const { container } = renderApp();
  expect(screen.getByRole('link', { name: /腦癎錦囊/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '日記' })).toHaveAttribute('aria-current', 'page');
  expect(container.querySelector('.official-banner, #appMode, .first-aid-banner')).toBeNull();
  for (const [id, label] of [['btn-attack', '腦癇記錄'], ['btn-headache', '頭痛記錄'], ['btn-meds', '服藥記錄'], ['btn-side', '副作用']]) {
    expect(container.querySelector(`#${id}`)).toHaveTextContent(label);
    expect(container.querySelector(`#${id}`)).not.toHaveClass('hidden');
  }
  expect(screen.getByRole('button', { name: /生理及健康/ })).toBeVisible();
  expect(screen.getByText('發作/頭痛')).toBeInTheDocument();
  expect(screen.getByText('(選填) 建議填寫綜合診斷資料、發作類型、腦電圖等數據，有助於為您的主診醫生生成更精準完整的 PDF 報告。')).toBeInTheDocument();
});

test.each([['zh-CN', '发作/头痛'], ['en', 'Seizure/Headache']])('localizes the legend in %s', (locale, legend) => {
  renderApp('/diary', locale);
  expect(screen.getByText(legend)).toBeInTheDocument();
});

test('switches calendar views and closes both modals with Escape', () => {
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
  fireEvent.click(screen.getByRole('button', { name: /生理及健康/ }));
  expect(screen.getByRole('heading', { name: '生理及健康狀況' })).toBeVisible();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('heading', { name: '生理及健康狀況' })).not.toBeInTheDocument();
});

test.each([
  ['#btn-attack', '/diary/event-log'], ['#btn-headache', '/diary/event-log'], ['#fabRecord', '/diary/event-log'],
  ['.profile-card', '/diary/profile'], ['[data-report="level-a"]', '/diary/report/level-a'], ['[data-report="level-b"]', '/diary/report/level-b'],
])('%s navigates to %s', (selector, destination) => {
  const { container } = renderApp();
  fireEvent.click(container.querySelector(selector));
  expect(screen.getByTestId('location')).toHaveTextContent(destination);
});

test('FAB exists only on the diary dashboard', () => {
  const { container } = renderApp('/');
  expect(container.querySelector('#fabRecord')).toBeNull();
});

test('close buttons dismiss dialogs and the dashboard body class is removed on exit', () => {
  const { unmount } = renderApp();
  expect(document.body).toHaveClass('page-dashboard');
  fireEvent.click(screen.getByRole('button', { name: /完整月曆/ }));
  fireEvent.click(screen.getByRole('button', { name: '關閉' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /生理及健康/ }));
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
