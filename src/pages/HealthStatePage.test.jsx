import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';

function Location() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

function renderApp(locale = 'zh-HK') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(
    <I18nProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/diary/event/health']}>
        <Location />
        <AppRoutes />
      </MemoryRouter>
    </I18nProvider>,
  );
}

test.each([
  ['zh-HK', '← 返回', '生理及健康狀況', '儲存', '女性生理期', '傷風感冒 (URTI)'],
  ['zh-CN', '← 返回', '生理及健康状况', '保存', '女性生理期', '伤风感冒 (URTI)'],
  ['en', '← Back', 'Physiological and health conditions', 'Save', 'Menstrual period', 'Cold (URTI)'],
])('renders localized health state page in %s without main app header', (locale, back, title, save, periodTag, urtiTag) => {
  const { container } = renderApp(locale);
  expect(container.querySelector('.app-header')).toBeNull();
  const subheader = container.querySelector('.diary-subheader');
  expect(within(subheader).getByRole('button', { name: back })).toBeVisible();
  expect(within(subheader).getByText(title)).toBeVisible();
  expect(within(subheader).getByRole('button', { name: save })).toBeVisible();
  expect(container.querySelector('#event-time')).toHaveValue('2026-09-17T17:30');
  expect(screen.getByRole('button', { name: periodTag })).toBeVisible();
  expect(screen.getByRole('button', { name: urtiTag })).toBeVisible();
});

test('toggles health condition tags, adds/removes custom health items, and warns on unsaved changes', () => {
  const { container } = renderApp('zh-HK');
  const period = screen.getByRole('button', { name: '女性生理期' });
  fireEvent.click(period);
  expect(period).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(screen.getByRole('button', { name: '+ 新增自訂狀況' }));
  expect(container.querySelectorAll('#custom-health-list input')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: '儲存' }));
  fireEvent.change(container.querySelector('#custom-health-list input'), { target: { value: '高強度訓練' } });
  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  expect(screen.getByRole('dialog', { name: '尚未儲存' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '繼續編輯' }));
  fireEvent.click(screen.getByRole('button', { name: '刪除' }));
  expect(container.querySelectorAll('#custom-health-list input')).toHaveLength(0);

  fireEvent.change(screen.getByLabelText('健康狀況備註'), { target: { value: '第一天經痛' } });
  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  expect(screen.getByRole('dialog', { name: '尚未儲存' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '確定離開' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
});

test('saving shows toast and clears dirty state', () => {
  renderApp('en');
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button', { name: 'Surgery' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('status')).toHaveTextContent('Entry saved!');
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '← Back' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
  vi.useRealTimers();
});
