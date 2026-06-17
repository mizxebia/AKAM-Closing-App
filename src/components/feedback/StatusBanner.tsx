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
  autoDismissMs = 5000,
}: StatusBannerProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)

    if (type === 'loading' || autoDismissMs <= 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(false)
    }, autoDismissMs)

    return () => window.clearTimeout(timeoutId)
  }, [autoDismissMs, message, type])

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
