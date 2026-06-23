import { useEffect } from 'react'

/**
 * Automatically clears a state value to null after `delayMs` whenever
 * it becomes non-null. Use it alongside a useState setter to get
 * auto-dismissing messages without wiring up timeouts manually.
 *
 * @param value   The current state value (null = nothing to clear).
 * @param setter  The setState dispatcher to call when the timer fires.
 * @param delayMs How long to wait before clearing (default 5000ms).
 */
export function useAutoClear<T>(
  value: T | null,
  setter: (v: null) => void,
  delayMs = 5000
): void {
  useEffect(() => {
    if (value === null) return
    const id = window.setTimeout(() => setter(null), delayMs)
    return () => window.clearTimeout(id)
  }, [value, setter, delayMs])
}
