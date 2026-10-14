/**
 * IndexedDB storage, kept in this browser only.
 * - `anims`: animations saved for printing, keyed by id
 * - `session`: the work in progress, so it comes back after a reload
 */

// the name predates the rename to Scanimation; keeping it preserves animations saved earlier
const DB_NAME = 'kinegram-studio';
const DB_VERSION = 2;

/** @type {Promise<IDBDatabase> | null} */
let dbPromise = null;

function open() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('anims')) db.createObjectStore('anims', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('session')) db.createObjectStore('session');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/**
 * Run one request in its own transaction and resolve with its result once the transaction commits.
 * @param {'anims' | 'session'} storeName
 * @param {IDBTransactionMode} mode
 * @param {(store: IDBObjectStore) => IDBRequest} fn
 */
async function run(storeName, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const req = fn(tx.objectStore(storeName));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const animations = {
  all: () => run('anims', 'readonly', (s) => s.getAll()),
  put: (record) => run('anims', 'readwrite', (s) => s.put(record)),
  delete: (id) => run('anims', 'readwrite', (s) => s.delete(id)),
};

export const session = {
  get: (key) => run('session', 'readonly', (s) => s.get(key)),
  put: (key, value) => run('session', 'readwrite', (s) => s.put(value, key)),
};
