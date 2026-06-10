const PREFIX = "salonapp:";

type CacheEnvelope<T> = { at: number; data: T };

export function readBrowserCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() - parsed.at > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeBrowserCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: CacheEnvelope<T> = { at: Date.now(), data };
    sessionStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    /* quota or private mode */
  }
}

export function clearBrowserCache(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function clearBrowserCachePrefix(prefix: string): void {
  if (typeof window === "undefined") return;
  try {
    const fullPrefix = PREFIX + prefix;
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(fullPrefix)) sessionStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
