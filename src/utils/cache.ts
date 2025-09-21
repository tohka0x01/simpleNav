const PREFIX = 'nav-cache';
export const CACHE_KEYS = {
  sites: 'sites',
  categories: 'categories'
} as const;
export const CACHE_BUST_KEY = `${PREFIX}:bust`;
export const DEFAULT_CACHE_TTL = 1000 * 60 * 60 * 24 * 3; // 3 days

type CacheBox<T> = {
  expires: number;
  payload: T;
};

function getStore(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function buildKey(key: string): string {
  return `${PREFIX}:${key}`;
}

export function readCache<T>(key: string): T | null {
  const store = getStore();
  if (!store) return null;
  const raw = store.getItem(buildKey(key));
  if (!raw) return null;
  try {
    const box = JSON.parse(raw) as CacheBox<T> | null;
    if (!box || typeof box.expires !== 'number') {
      store.removeItem(buildKey(key));
      return null;
    }
    if (box.expires <= Date.now()) {
      store.removeItem(buildKey(key));
      return null;
    }
    return box.payload;
  } catch {
    store.removeItem(buildKey(key));
    return null;
  }
}

export function writeCache<T>(key: string, payload: T, ttl = DEFAULT_CACHE_TTL): void {
  const store = getStore();
  if (!store) return;
  try {
    const box: CacheBox<T> = {
      payload,
      expires: Date.now() + Math.max(ttl, 0)
    };
    store.setItem(buildKey(key), JSON.stringify(box));
  } catch {
    // ignore quota errors
  }
}

export function invalidateCache(keys?: Array<string>): void {
  const store = getStore();
  if (!store) return;
  const targetKeys = Array.isArray(keys) && keys.length > 0 ? keys : Object.values(CACHE_KEYS);
  for (const key of targetKeys) {
    try {
      store.removeItem(buildKey(key));
    } catch {
      // ignore
    }
  }
  try {
    store.setItem(CACHE_BUST_KEY, Date.now().toString());
  } catch {
    // ignore quota errors
  }
}
