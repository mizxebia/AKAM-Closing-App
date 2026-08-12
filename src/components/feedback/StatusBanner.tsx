import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface StatusBannerProps {
  type: 'loading' | 'error' | 'info' | 'success' | 'warning'
  message: string
  autoDismissMs?: number
}

export function StatusBanner({
  type,
  message,
  autoDismissMs,
}: StatusBannerProps) {
  const [visible, setVisible] = useState(true)
  // Errors get longer on-screen time by default so there's time to read
  // and copy the message before it disappears; callers can still override.
  const effectiveAutoDismissMs =
    autoDismissMs ?? (type === 'error' ? 20000 : 5000)

  useEffect(() => {
    setVisible(true)

    if (type === 'loading' || effectiveAutoDismissMs <= 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(false)
    }, effectiveAutoDismissMs)

    return () => window.clearTimeout(timeoutId)
  }, [effectiveAutoDismissMs, message, type])

  if (!visible) {
    return null
  }

  return (
    <div
      className={`status-banner status-${type}`}
      role="status"
      aria-live="polite"
    >
      <span>{message}</span>
      {type !== 'loading' && (
        <button
          type="button"
          className="status-banner-close"
          onClick={() => setVisible(false)}
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
