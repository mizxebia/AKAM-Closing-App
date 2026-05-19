interface StatusBannerProps {
  type: 'loading' | 'error' | 'info'
  message: string
}

export function StatusBanner({ type, message }: StatusBannerProps) {
  return (
    <div className={`status-banner status-${type}`}>
      {message}
    </div>
  )
}
