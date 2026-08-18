export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

type Listener = (toasts: ToastMessage[]) => void

let toasts: ToastMessage[] = []
let listeners: Listener[] = []
let counter = 0

function emit() {
  listeners.forEach((listener) => listener(toasts))
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function push(
  type: ToastType,
  message: string,
  durationMs: number
) {
  counter += 1
  const id = `toast-${counter}`
  toasts = [...toasts, { id, type, message }]
  emit()
  window.setTimeout(() => dismissToast(id), durationMs)
}

/**
 * Fire-and-forget confirmation popups for actions that otherwise complete
 * silently. Keep usage sparing — most forms already surface success via an
 * inline StatusBanner, which is enough on its own.
 */
export const toast = {
  success: (message: string, durationMs = 3200) =>
    push('success', message, durationMs),
  error: (message: string, durationMs = 4500) =>
    push('error', message, durationMs),
  info: (message: string, durationMs = 3200) =>
    push('info', message, durationMs),
}

export function subscribeToasts(listener: Listener) {
  listeners.push(listener)
  listener(toasts)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}
