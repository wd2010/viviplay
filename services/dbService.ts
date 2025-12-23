
const DB_NAME = 'FantasyParkDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_collections';

class DBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    });
  }

  async set(key: string, value: any): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save key: ${key}`));
    });
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get key: ${key}`));
    });
  }

  /**
   * 迁移旧的 localStorage 数据到 IndexedDB
   */
  async migrateFromLocalStorage(): Promise<void> {
    const keys = ['fp_users', 'fp_actions', 'fp_shop', 'fp_theme_id'];
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          // 如果是 JSON 字符串则解析，否则直接存
          const parsed = val.startsWith('[') || val.startsWith('{') ? JSON.parse(val) : val;
          await this.set(key, parsed);
          localStorage.removeItem(key); // 迁移成功后删除旧数据
        } catch (e) {
          console.warn(`Migration failed for ${key}`, e);
        }
      }
    }
  }
}

export const dbService = new DBService();
