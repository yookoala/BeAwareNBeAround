import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';

function Location() { return <div data-testid="location">{useLocation().pathname}</div>; }
function renderApp(locale = 'zh-HK') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={['/diary/event-log']}><Location /><AppRoutes /></MemoryRouter></I18nProvider>);
}

test.each([
  ['zh-HK', '← 返回', '新增記錄', '儲存'],
  ['zh-CN', '← 返回', '新增记录', '保存'],
  ['en', '← Back', 'New Entry', 'Save'],
])('replaces the main app header with the localized event-log header bar in %s', (locale, back, title, save) => {
  const { container } = renderApp(locale);
  const subheader = container.querySelector('.diary-subheader');
  expect(within(subheader).getByRole('button', { name: back })).toHaveAttribute('type', 'button');
  expect(within(subheader).getByText(title)).toBeVisible();
  expect(within(subheader).getByRole('button', { name: save })).toBeVisible();
  expect(container.querySelectorAll('header')).toHaveLength(1);
  expect(container.querySelector('.app-header')).toBeNull();
  expect(container.querySelector('.bottom-nav a[href="/diary"]')).toHaveAttribute('aria-current', 'page');
  expect(container.querySelector('input[type="datetime-local"]')).toHaveValue('2026-09-17T17:30');
});

test('back returns to diary immediately when unchanged and cleans up the body class', () => {
  renderApp();
  expect(document.body).toHaveClass('page-event-log');
  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary');
  expect(document.body).not.toHaveClass('page-event-log');
});

test('warns before leaving when form has unsaved changes, and allows staying or leaving', () => {
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: '小發作' }));
  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event-log');
  const dialog = screen.getByRole('dialog', { name: '尚未儲存' });
  expect(dialog).toBeVisible();
  expect(within(dialog).getByText('您有尚未儲存的更改，確定要離開嗎？')).toBeVisible();
  fireEvent.click(within(dialog).getByRole('button', { name: '繼續編輯' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event-log');

  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  fireEvent.click(screen.getByRole('button', { name: '確定離開' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary');
});

test('saving clears the dirty state so back navigates without warning', () => {
  renderApp('en');
  fireEvent.change(screen.getByLabelText('Seizure description / notes'), { target: { value: 'Cluster after missed dose' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  fireEvent.click(screen.getByRole('button', { name: '← Back' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/diary');
});

test('severity and pattern options toggle and the cluster counter has a floor and resets', () => {
  const { container } = renderApp();
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
});

test('aura and trigger selections survive language changes and no aura stays exclusive', () => {
  renderApp();
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

test.each([['zh-HK', '儲存', '記錄已儲存！'], ['zh-CN', '保存', '记录已保存！'], ['en', 'Save', 'Entry saved!']])('announces save temporarily in %s', (locale, save, message) => {
  renderApp(locale);
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button', { name: save }));
  expect(screen.getByRole('status')).toHaveTextContent(message);
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  vi.useRealTimers();
});
