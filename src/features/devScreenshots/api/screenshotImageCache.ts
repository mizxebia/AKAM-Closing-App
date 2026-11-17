// Persists downloaded screenshot data URLs in IndexedDB so reopening a
// ticket (even after a full app reload) doesn't re-download every image.
// Every operation degrades to a no-op when IndexedDB is unavailable.

const DB_NAME = 'akam-bot-screenshots'
const STORE_NAME = 'images'
const MAX_STORED_IMAGES = 200
const MAX_IMAGE_AGE_MS = 7 * 24 * 60 * 60 * 1000

interface StoredImage {
  key: string
  dataUrl: string
  savedAt: number
}

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null)
        return
      }
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE_NAME, {
          keyPath: 'key',
        })
        store.createIndex('savedAt', 'savedAt')
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })

  return dbPromise
}

export async function readStoredImage(
  key: string
): Promise<string | null> {
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve) => {
    try {
      const request = db
        .transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .get(key)
      request.onsuccess = () => {
        const entry = request.result as StoredImage | undefined
        resolve(
          entry && Date.now() - entry.savedAt < MAX_IMAGE_AGE_MS
            ? entry.dataUrl
            : null
        )
      }
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function writeStoredImage(
  key: string,
  dataUrl: string
): Promise<void> {
  const db = await openDb()
  if (!db) return

  try {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.put({ key, dataUrl, savedAt: Date.now() } satisfies StoredImage)

    // Trim the oldest entries so the cache can't grow without bound.
    const countRequest = store.count()
    countRequest.onsuccess = () => {
      let excess = countRequest.result - MAX_STORED_IMAGES
      if (excess <= 0) return
      const cursorRequest = store.index('savedAt').openCursor()
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result
        if (!cursor || excess <= 0) return
        cursor.delete()
        excess -= 1
        cursor.continue()
      }
    }
  } catch {
    // Caching is best-effort.
  }
}
