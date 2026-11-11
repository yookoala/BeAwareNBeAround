import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addEntry,
  deleteEntry,
  getEntry,
  listEntries,
  listRecent,
  updateEntry,
} from './diaryEntries';

// Each test gets a fresh fake IndexedDB factory; the service is called with
// it explicitly. listEntries builds IDBKeyRange bounds, so the fake Range
// class must back the global the service reads.
function freshFactory() {
  return new IDBFactory();
}

function entry(overrides) {
  return { type: 'seizure', time: '2026-09-14T10:00', data: { notes: '' }, ...overrides };
}

describe('diaryEntries', () => {
  let factory;

  beforeEach(() => {
    factory = freshFactory();
    vi.stubGlobal('IDBKeyRange', IDBKeyRange);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('addEntry / getEntry', () => {
    it('round-trips every field and stamps identical creation timestamps', async () => {
      const data = { severity: 'major', pattern: 'cluster', clusterCount: 3, auras: ['visual'], triggers: ['stress'], notes: 'in the morning' };
      const created = await addEntry(entry({ time: '2026-09-14T10:00', data }), factory);

      expect(created.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(created.type).toBe('seizure');
      expect(created.time).toBe('2026-09-14T10:00');
      expect(created.createdAt).toBe(created.updatedAt);

      const stored = await getEntry(created.id, factory);
      expect(stored).toEqual(created);
      expect(stored.data).toEqual(data);
    });

    it('resolves undefined for a missing id', async () => {
      await expect(getEntry('does-not-exist', factory)).resolves.toBeUndefined();
    });
  });

  describe('updateEntry', () => {
    it('replaces time and data but preserves id, type and createdAt', async () => {
      const created = await addEntry(entry({ data: { notes: 'first' } }), factory);
      await new Promise((resolve) => setTimeout(resolve, 5));

      const updated = await updateEntry(created.id, { time: '2026-09-15T08:30', data: { notes: 'edited' } }, factory);

      expect(updated.id).toBe(created.id);
      expect(updated.type).toBe(created.type);
      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.updatedAt).not.toBe(created.updatedAt);
      expect(updated.time).toBe('2026-09-15T08:30');
      await expect(getEntry(created.id, factory)).resolves.toMatchObject({
        createdAt: created.createdAt,
        time: '2026-09-15T08:30',
        data: { notes: 'edited' },
      });
    });

    it('resolves undefined for a missing id without creating a record', async () => {
      await expect(updateEntry('does-not-exist', { time: '2026-09-15T08:30', data: {} }, factory)).resolves.toBeUndefined();
    });
  });

  describe('deleteEntry', () => {
    it('removes the record', async () => {
      const created = await addEntry(entry(), factory);
      await deleteEntry(created.id, factory);
      await expect(getEntry(created.id, factory)).resolves.toBeUndefined();
    });

    it('is a no-op for a missing id', async () => {
      await expect(deleteEntry('does-not-exist', factory)).resolves.not.toThrow();
    });
  });

  describe('listEntries', () => {
    it('returns an empty array for an empty store', async () => {
      await expect(listEntries({ limit: 25 }, factory)).resolves.toEqual([]);
    });

    it('returns the newest entries first', async () => {
      await addEntry(entry({ time: '2026-09-12T10:00', data: { tag: 'old' } }), factory);
      await addEntry(entry({ time: '2026-09-15T10:00', data: { tag: 'new' } }), factory);
      await addEntry(entry({ time: '2026-09-13T10:00', data: { tag: 'middle' } }), factory);

      const entries = await listEntries({ limit: 25 }, factory);
      expect(entries.map((e) => e.data.tag)).toEqual(['new', 'middle', 'old']);
    });

    it('returns everything when the limit exceeds the store', async () => {
      await addEntry(entry({ time: '2026-09-12T10:00' }), factory);
      await addEntry(entry({ time: '2026-09-13T10:00' }), factory);
      await expect(listEntries({ limit: 25 }, factory)).resolves.toHaveLength(2);
    });

    it('pages with a [time, id] cursor without overlap or gaps, including identical timestamps', async () => {
      const times = ['2026-09-10T10:00', '2026-09-10T10:00', '2026-09-10T10:00', '2026-09-11T10:00', '2026-09-12T10:00'];
      const created = [];
      for (const time of times) created.push(await addEntry(entry({ time }), factory));

      // Index order is (time DESC, id DESC): ties sort by id descending.
      const ordered = [...created].sort((a, b) =>
        b.time.localeCompare(a.time) || b.id.localeCompare(a.id),
      );

      const firstPage = await listEntries({ limit: 2 }, factory);
      expect(firstPage.map((e) => e.id)).toEqual(ordered.slice(0, 2).map((e) => e.id));

      const last = firstPage.at(-1);
      const secondPage = await listEntries({ limit: 2, before: [last.time, last.id] }, factory);
      expect(secondPage.map((e) => e.id)).toEqual(ordered.slice(2, 4).map((e) => e.id));

      const thirdPage = await listEntries({ limit: 2, before: [secondPage.at(-1).time, secondPage.at(-1).id] }, factory);
      expect(thirdPage.map((e) => e.id)).toEqual(ordered.slice(4).map((e) => e.id));

      const paged = [...firstPage, ...secondPage, ...thirdPage];
      expect(paged.map((e) => e.id)).toEqual(ordered.map((e) => e.id));
    });
  });

  describe('listRecent', () => {
    it('returns at most five newest entries when more exist', async () => {
      for (let day = 10; day <= 19; day += 1) {
        await addEntry(entry({ time: `2026-09-${day}T10:00`, data: { day } }), factory);
      }
      const recent = await listRecent(5, factory);
      expect(recent).toHaveLength(5);
      expect(recent.map((e) => e.data.day)).toEqual([19, 18, 17, 16, 15]);
    });
  });

  describe('failed open', () => {
    it('rejects every operation when the database cannot be opened', async () => {
      const failingFactory = {
        open() {
          const request = { onerror: null };
          setTimeout(() => request.onerror?.({ target: { error: new Error('blocked') } }), 0);
          return request;
        },
      };
      await expect(addEntry(entry(), failingFactory)).rejects.toThrow();
      await expect(getEntry('any', failingFactory)).rejects.toThrow();
      await expect(updateEntry('any', { time: '2026-09-15T08:30', data: {} }, failingFactory)).rejects.toThrow();
      await expect(deleteEntry('any', failingFactory)).rejects.toThrow();
      await expect(listEntries({ limit: 25 }, failingFactory)).rejects.toThrow();
    });
  });
});
