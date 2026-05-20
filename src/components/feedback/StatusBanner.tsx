import { useEffect, useState } from 'react'

interface StatusBannerProps {
  type: 'loading' | 'error' | 'info' | 'success'
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
    <div className={`status-banner status-${type}`}>
      {message}
    </div>
  )
}
