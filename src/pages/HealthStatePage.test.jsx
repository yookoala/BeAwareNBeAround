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

function renderApp(locale = 'zh-HK', path = '/diary/event/health') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(
    <I18nProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
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
  freezeNow();
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
  const leaveDialog = screen.getByRole('dialog', { name: '尚未儲存' });
  expect(leaveDialog).toBeVisible();
  // M19-008: modal <dialog>, no close control, Stay is the focused choice.
  expect(leaveDialog.tagName).toBe('DIALOG');
  expect(within(leaveDialog).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  expect(within(leaveDialog).getByRole('button', { name: '繼續編輯' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: '繼續編輯' }));
  fireEvent.click(screen.getByRole('button', { name: '刪除' }));
  expect(container.querySelectorAll('#custom-health-list input')).toHaveLength(0);

  fireEvent.change(screen.getByLabelText('健康狀況備註'), { target: { value: '第一天經痛' } });
  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  expect(screen.getByRole('dialog', { name: '尚未儲存' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '確定離開' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
});

test('saving shows toast and clears dirty state', async () => {
  renderApp('en');
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button', { name: 'Surgery' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  });
  expect(screen.getByRole('status')).toHaveTextContent('Entry saved!');
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '← Back' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
  vi.useRealTimers();
});

test('saving stores a health entry with tag ids, custom item values, and notes', async () => {
  freezeNow();
  const { container } = renderApp('zh-HK');
  fireEvent.click(screen.getByRole('button', { name: '女性生理期' }));
  fireEvent.click(screen.getByRole('button', { name: '+ 新增自訂狀況' }));
  fireEvent.change(container.querySelector('#custom-health-list input'), { target: { value: '高強度訓練' } });
  fireEvent.change(screen.getByLabelText('健康狀況備註'), { target: { value: '第一天經痛' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '儲存' }));
  });

  expect(addEntry).toHaveBeenCalledTimes(1);
  expect(addEntry.mock.calls[0][0]).toEqual({
    type: 'health',
    time: '2026-09-17T17:30',
    data: { selectedTags: ['period'], customItems: ['高強度訓練'], notes: '第一天經痛' },
  });
});

// --- M19-006 edit mode ---

const storedHealth = {
  id: 'h1',
  type: 'health',
  time: '2026-09-13T19:30',
  createdAt: '2026-09-13T19:00:00.000Z',
  updatedAt: '2026-09-13T19:00:00.000Z',
  data: { selectedTags: ['period'], customItems: ['高強度訓練'], notes: '第一天經痛' },
};

async function settleEditLoad() {
  await act(async () => {
    await Promise.resolve();
  });
}

test('editing a health entry pre-selects tags and pre-fills stored custom item texts', async () => {
  getEntry.mockResolvedValueOnce(storedHealth);
  renderApp('zh-HK', '/diary/event/health?edit=h1');
  await settleEditLoad();

  expect(screen.getByLabelText('記錄時間')).toHaveValue('2026-09-13T19:30');
  expect(screen.getByRole('button', { name: '女性生理期' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByDisplayValue('高強度訓練')).toBeInTheDocument();
  expect(screen.getByLabelText('健康狀況備註')).toHaveValue('第一天經痛');
});

test('saving an edited health entry updates it in place with tag ids and custom texts', async () => {
  addEntry.mockClear();
  getEntry.mockResolvedValueOnce(storedHealth);
  renderApp('zh-HK', '/diary/event/health?edit=h1');
  await settleEditLoad();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '儲存' }));
    await Promise.resolve();
  });

  expect(updateEntry).toHaveBeenCalledTimes(1);
  expect(updateEntry).toHaveBeenCalledWith('h1', {
    time: '2026-09-13T19:30',
    data: { selectedTags: ['period'], customItems: ['高強度訓練'], notes: '第一天經痛' },
  });
  expect(addEntry).not.toHaveBeenCalled();
  expect(screen.getByTestId('location').textContent).toBe('/diary/entry/h1');
  expect(screen.getByTestId('location-state')).toHaveTextContent('{"saved":true}');
});
