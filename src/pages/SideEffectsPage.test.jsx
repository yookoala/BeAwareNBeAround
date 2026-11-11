import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';
import { addEntry } from '../services/diaryEntries';

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
  return <div data-testid="location">{useLocation().pathname}</div>;
}

function renderApp(locale = 'zh-HK') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(
    <I18nProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/diary/event/side-effects']}>
        <Location />
        <AppRoutes />
      </MemoryRouter>
    </I18nProvider>,
  );
}

test.each([
  ['zh-HK', '← 返回', '副作用', '儲存', '嗜睡/疲倦', '手部震顫'],
  ['zh-CN', '← 返回', '副作用', '保存', '嗜睡/疲倦', '手部震颤'],
  ['en', '← Back', 'Side effects', 'Save', 'Drowsiness/fatigue', 'Hand tremor'],
])('renders localized side effects page in %s without main app header', (locale, back, title, save, firstTag, tremorTag) => {
  freezeNow();
  const { container } = renderApp(locale);
  expect(container.querySelector('.app-header')).toBeNull();
  const subheader = container.querySelector('.diary-subheader');
  expect(within(subheader).getByRole('button', { name: back })).toBeVisible();
  expect(within(subheader).getByText(title)).toBeVisible();
  expect(within(subheader).getByRole('button', { name: save })).toBeVisible();
  expect(container.querySelector('#event-time')).toHaveValue('2026-09-17T17:30');
  expect(screen.getByRole('button', { name: firstTag })).toBeVisible();
  expect(screen.getByRole('button', { name: tremorTag })).toBeVisible();
});

test('toggles side effect selection, manages adding and removing side effects, and records extra observations', () => {
  renderApp('zh-HK');
  const tremor = screen.getByRole('button', { name: '手部震顫' });
  fireEvent.click(tremor);
  expect(tremor).toHaveAttribute('aria-pressed', 'true');

  // Toggle management mode to add a custom side effect and remove an existing one
  fireEvent.click(screen.getByRole('button', { name: '管理副作用項目' }));
  const input = screen.getByPlaceholderText('輸入新增副作用...');
  fireEvent.change(input, { target: { value: '視力模糊' } });
  fireEvent.click(screen.getByRole('button', { name: '+ 新增副作用' }));
  expect(input).toHaveValue('');
  expect(screen.getByText('視力模糊')).toBeInTheDocument();

  // Remove 手部震顫 while it is selected
  fireEvent.click(screen.getByRole('button', { name: '移除 手部震顫' }));
  expect(screen.queryByText('手部震顫')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '完成管理' }));
  const customTag = screen.getByRole('button', { name: '視力模糊' });
  fireEvent.click(customTag);
  expect(customTag).toHaveAttribute('aria-pressed', 'true');

  // Extra observations textarea
  const notes = screen.getByLabelText('額外觀察 / 備註');
  fireEvent.change(notes, { target: { value: '服藥後兩小時出現' } });
  expect(notes).toHaveValue('服藥後兩小時出現');
});

test('warns on unsaved changes when leaving and saves cleanly with toast', async () => {
  renderApp('zh-HK');
  vi.useFakeTimers();
  fireEvent.change(screen.getByLabelText('額外觀察 / 備註'), { target: { value: '輕微頭暈' } });
  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  expect(screen.getByRole('dialog', { name: '尚未儲存' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '繼續編輯' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '儲存' }));
  });
  expect(screen.getByRole('status')).toHaveTextContent('記錄已儲存！');
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary/event');
  vi.useRealTimers();
});

test('saving stores a side-effects entry with built-in tag ids and labeled custom tags', async () => {
  freezeNow();
  renderApp('zh-HK');
  fireEvent.click(screen.getByRole('button', { name: '手部震顫' }));

  fireEvent.click(screen.getByRole('button', { name: '管理副作用項目' }));
  fireEvent.change(screen.getByPlaceholderText('輸入新增副作用...'), { target: { value: '視力模糊' } });
  fireEvent.click(screen.getByRole('button', { name: '+ 新增副作用' }));
  fireEvent.click(screen.getByRole('button', { name: '完成管理' }));
  fireEvent.click(screen.getByRole('button', { name: '視力模糊' }));
  fireEvent.change(screen.getByLabelText('額外觀察 / 備註'), { target: { value: '服藥後兩小時出現' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '儲存' }));
  });

  expect(addEntry).toHaveBeenCalledTimes(1);
  const [payload] = addEntry.mock.calls[0];
  expect(payload.type).toBe('sideEffects');
  expect(payload.time).toBe('2026-09-17T17:30');
  expect(payload.data.notes).toBe('服藥後兩小時出現');
  expect(payload.data.selected).toHaveLength(2);
  expect(payload.data.selected).toContainEqual({ id: 'tremor' });
  expect(payload.data.selected).toContainEqual(
    expect.objectContaining({ id: expect.stringMatching(/^[0-9a-f-]{36}$/), label: '視力模糊' }),
  );
});
