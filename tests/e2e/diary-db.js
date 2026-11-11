// Shared Playwright helpers for diary specs: seed rows into the same
// IndexedDB store/schema the app opens (M19 device-local storage). Each test
// runs in a fresh browser context, so IndexedDB always starts empty and
// seeding after the first goto() is hermetic.

export async function seedDiaryEntries(page, rows) {
  await page.evaluate(async (entries) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('beaware-diary', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('entries')) {
          db.createObjectStore('entries', { keyPath: 'id' }).createIndex('by_time', ['time', 'id']);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('entries', 'readwrite');
        for (const row of entries) transaction.objectStore('entries').put(row);
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
  }, rows);
}

// Five pinned 2026-09 rows covering every recordable type; the retired
// fixture's dates, so list ordering assertions are deterministic.
export const journeySeedEntries = [
  { id: 'seed-1', type: 'seizure', time: '2026-09-15T16:00', createdAt: '2026-09-15T16:00:00.000Z', updatedAt: '2026-09-15T16:00:00.000Z', data: { severity: 'minor', pattern: 'single', clusterCount: 2, auras: [], triggers: [], notes: '' } },
  { id: 'seed-2', type: 'headache', time: '2026-09-14T21:15', createdAt: '2026-09-14T21:15:00.000Z', updatedAt: '2026-09-14T21:15:00.000Z', data: { severity: 'major', pattern: 'single', clusterCount: 2, auras: [], triggers: [], notes: '' } },
  { id: 'seed-3', type: 'sideEffects', time: '2026-09-14T08:00', createdAt: '2026-09-14T08:00:00.000Z', updatedAt: '2026-09-14T08:00:00.000Z', data: { selected: [{ id: 'drowsiness' }, { id: 'tremor' }], notes: '' } },
  { id: 'seed-4', type: 'health', time: '2026-09-13T19:30', createdAt: '2026-09-13T19:30:00.000Z', updatedAt: '2026-09-13T19:30:00.000Z', data: { selectedTags: ['period'], customItems: [], notes: '' } },
  { id: 'seed-5', type: 'seizure', time: '2026-09-10T11:00', createdAt: '2026-09-10T11:00:00.000Z', updatedAt: '2026-09-10T11:00:00.000Z', data: { severity: 'major', pattern: 'cluster', clusterCount: 3, auras: [], triggers: [], notes: '' } },
];
