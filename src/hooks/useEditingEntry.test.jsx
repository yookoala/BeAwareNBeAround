import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import { getEntry } from '../services/diaryEntries';
import { useEditingEntry } from './useEditingEntry';

vi.mock('../services/diaryEntries', () => ({
  addEntry: vi.fn(async (input) => ({ id: 'stub-entry', createdAt: '', updatedAt: '', ...input })),
  getEntry: vi.fn(async () => undefined),
  updateEntry: vi.fn(async () => undefined),
  deleteEntry: vi.fn(async () => undefined),
  listEntries: vi.fn(async () => []),
  listRecent: vi.fn(async () => []),
}));

const stored = { id: 'e1', type: 'seizure', time: '2026-09-15T16:00', createdAt: '', updatedAt: '', data: { severity: 'minor' } };

const wrapperFor = (path) =>
  function Wrapper({ children }) {
    return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>;
  };

beforeEach(() => {
  getEntry.mockReset();
  getEntry.mockResolvedValue(undefined);
});

test('without an edit param the hook settles immediately and never reads storage', () => {
  const seed = vi.fn();
  const { result } = renderHook(() => useEditingEntry(seed), { wrapper: wrapperFor('/diary/event/seizure') });

  expect(result.current.editingId).toBeNull();
  expect(result.current.settled).toBe(true);
  expect(result.current.entry).toBeNull();
  expect(getEntry).not.toHaveBeenCalled();
});

test('a stored entry is loaded once and handed to the seed callback', async () => {
  getEntry.mockResolvedValueOnce(stored);
  const seed = vi.fn();
  const { result } = renderHook(() => useEditingEntry(seed), { wrapper: wrapperFor('/diary/event/seizure?edit=e1') });

  expect(result.current.editingId).toBe('e1');
  expect(result.current.settled).toBe(false);
  await waitFor(() => expect(result.current.settled).toBe(true));
  expect(getEntry).toHaveBeenCalledTimes(1);
  expect(getEntry).toHaveBeenCalledWith('e1');
  expect(seed).toHaveBeenCalledWith(stored);
  expect(result.current.entry).toBe(stored);
});

test('an unknown id settles without an entry so the page can fall back to create mode', async () => {
  const seed = vi.fn();
  const { result } = renderHook(() => useEditingEntry(seed), { wrapper: wrapperFor('/diary/event/seizure?edit=nope') });

  await waitFor(() => expect(result.current.settled).toBe(true));
  expect(seed).not.toHaveBeenCalled();
  expect(result.current.entry).toBeNull();
});

test('a storage read failure settles without an entry', async () => {
  getEntry.mockRejectedValueOnce(new Error('storage unavailable'));
  const { result } = renderHook(() => useEditingEntry(vi.fn()), { wrapper: wrapperFor('/diary/event/seizure?edit=e1') });

  await waitFor(() => expect(result.current.settled).toBe(true));
  expect(result.current.entry).toBeNull();
});
