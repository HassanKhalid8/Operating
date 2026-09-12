/* ═══════════════════════════════════════════════════════════
   Browser-local persistence.

   There is no server in this build and there isn't going to be one, so
   anything she makes is written to her own browser's localStorage and
   never leaves the phone it was made on. That is the whole storage
   layer. Every read is defensive: storage throws outright in private
   mode on some browsers, and a half-written value from an older build
   must never take the desktop down with it.
   ═══════════════════════════════════════════════════════════ */

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/** Returns false if the write was refused — full quota, or no storage at all. */
export function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
