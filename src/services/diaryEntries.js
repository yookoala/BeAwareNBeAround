// Device-local diary entry store (PLAN12). All diary data stays on the
// device (D14 privacy note): the UI reads/writes entries only through these
// functions. Every operation rejects on storage failure so views can show
// "records unavailable" instead of the empty state.
const DB_NAME = 'beaware-diary';
const DB_VERSION = 1;
const STORE_NAME = 'entries';
const INDEX_NAME = 'by_time';

// Memoized per factory so unit tests can inject fresh fake IDBFactory
// instances while the app shares one real indexedDB handle.
const dbCache = new WeakMap();

// Guarded so environments without IndexedDB (e.g. jsdom) reject through the
// promise chain instead of throwing while callers render.
function defaultFactory() {
  return typeof indexedDB === 'undefined' ? null : indexedDB;
}

function openDb(factory = defaultFactory()) {
  if (!factory) {
    return Promise.reject(new Error('IndexedDB is unavailable in this environment'));
  }
  if (!dbCache.has(factory)) {
    dbCache.set(factory, new Promise((resolve, reject) => {
      const request = factory.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Compound key keeps paging stable when entries share a timestamp:
          // a 'prev' cursor yields (time DESC, id DESC).
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            .createIndex(INDEX_NAME, ['time', 'id']);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Diary database open failed'));
      request.onblocked = () => reject(new Error('Diary database open blocked'));
    }));
  }
  return dbCache.get(factory);
}

export async function addEntry({ type, time, data }, factory) {
  const now = new Date().toISOString();
  const entry = { id: crypto.randomUUID(), type, time, createdAt: now, updatedAt: now, data };
  const db = await openDb(factory);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(entry);
    transaction.oncomplete = () => resolve(entry);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function getEntry(id, factory) {
  const db = await openDb(factory);
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateEntry(id, { time, data }, factory) {
  const db = await openDb(factory);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    // Read-modify-write in one transaction: id, type and createdAt can never
    // be overwritten by callers.
    let updated;
    const request = store.get(id);
    request.onsuccess = () => {
      const existing = request.result;
      if (!existing) return;
      updated = {
        ...existing,
        time: time ?? existing.time,
        data: data ?? existing.data,
        updatedAt: new Date().toISOString(),
      };
      store.put(updated);
    };
    transaction.oncomplete = () => resolve(updated);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function deleteEntry(id, factory) {
  const db = await openDb(factory);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function listEntries({ limit = 25, before } = {}, factory) {
  const db = await openDb(factory);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
    const index = transaction.objectStore(STORE_NAME).index(INDEX_NAME);
    // `before` is the [time, id] of the last rendered row: exclusive
    // upperBound on a 'prev' cursor yields the next page with no overlap.
    const range = before ? IDBKeyRange.upperBound(before, true) : undefined;
    const entries = [];
    const cursor = index.openCursor(range, 'prev');
    cursor.onsuccess = () => {
      const found = cursor.result;
      if (!found || entries.length >= limit) return resolve(entries);
      entries.push(found.value);
      found.continue();
    };
    cursor.onerror = () => reject(cursor.error);
  });
}

export function listRecent(limit, factory) {
  return listEntries({ limit }, factory);
}
