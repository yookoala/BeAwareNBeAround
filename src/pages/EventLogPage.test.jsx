import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';

function Location() { return <div data-testid="location">{useLocation().pathname}</div>; }
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

test('saving clears the dirty state so back navigates without warning', () => {
  renderApp('en');
  fireEvent.change(screen.getByLabelText('Seizure description / notes'), { target: { value: 'Cluster after missed dose' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
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

test.each([['zh-HK', '儲存', '記錄已儲存！'], ['zh-CN', '保存', '记录已保存！'], ['en', 'Save', 'Entry saved!']])('announces save temporarily in %s', (locale, save, message) => {
  renderApp(locale);
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button', { name: save }));
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
