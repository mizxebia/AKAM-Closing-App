import { useCallback, useEffect, useRef } from 'react'

/**
 * Calls `callback` on a repeating interval while the document tab is visible
 * and no interactive element (input, textarea, select) is focused.
 *
 * Polling is completely silent — no loading state is managed here. The
 * callback itself (typically a `refresh` function from a data hook) is
 * responsible for its own in-flight state.
 *
 * @param callback  The async function to call on each tick.
 * @param intervalMs  Polling interval in milliseconds (default 30 000).
 * @param enabled  Set to false to disable polling entirely (e.g. no ticketId).
 */
export function usePolling(
  callback: () => Promise<void> | void,
  intervalMs = 30_000,
  enabled = true
): void {
  // Keep a stable ref so changing `callback` identity doesn't restart the timer.
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const isUserEditing = useCallback(() => {
    const active = document.activeElement
    if (!active) return false
    const tag = active.tagName.toLowerCase()
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      (active as HTMLElement).isContentEditable
    )
  }, [])

  useEffect(() => {
    if (!enabled) return

    const tick = () => {
      // Skip the poll if the tab is hidden or the user is mid-edit.
      if (document.hidden || isUserEditing()) return
      void callbackRef.current()
    }

    const id = window.setInterval(tick, intervalMs)
    return () => window.clearInterval(id)
  }, [enabled, intervalMs, isUserEditing])
}
