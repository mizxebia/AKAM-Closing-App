import { Bug } from 'lucide-react'

interface DeveloperModeToggleProps {
  enabled: boolean
  onToggle: () => void
  /**
   * 'default' (h-10, text-sm) matches the taller icon-button row on the
   * Closing Details page. 'compact' (h-9, uppercase text-xs) matches the
   * dashboard's Developer Tools bar, where it otherwise stood out as
   * visibly taller/larger than the View Logs/Bulk... buttons beside it.
   */
  size?: 'default' | 'compact'
}

export function DeveloperModeToggle({
  enabled,
  onToggle,
  size = 'default',
}: DeveloperModeToggleProps) {
  const sizeClasses =
    size === 'compact'
      ? 'h-9 px-3 text-xs font-semibold uppercase tracking-[0.08em]'
      : 'h-10 px-3 text-sm font-semibold'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={
        enabled
          ? `inline-flex items-center justify-center gap-2 rounded-lg border border-[#1E3A47] bg-[#1E3A47] text-[#F5F2EC] shadow-sm transition ${sizeClasses}`
          : `inline-flex items-center justify-center gap-2 rounded-lg border border-[#D5CBB8] bg-white text-[#1E3A47] shadow-sm transition hover:bg-[#F5F2EC] ${sizeClasses}`
      }
      title="Toggle Developer Mode"
    >
      <Bug className="size-4" />
      Developer Mode
    </button>
  )
}
