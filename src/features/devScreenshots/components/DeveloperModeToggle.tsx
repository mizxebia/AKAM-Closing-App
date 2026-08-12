import { Bug } from 'lucide-react'

interface DeveloperModeToggleProps {
  enabled: boolean
  onToggle: () => void
}

export function DeveloperModeToggle({
  enabled,
  onToggle,
}: DeveloperModeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={
        enabled
          ? 'inline-flex h-10 items-center gap-2 rounded-lg border border-[#1E3A47] bg-[#1E3A47] px-3 text-sm font-semibold text-[#F5F2EC] shadow-sm transition'
          : 'inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-sm font-semibold text-[#1E3A47] shadow-sm transition hover:bg-[#F5F2EC]'
      }
      title="Toggle Developer Mode"
    >
      <Bug className="size-4" />
      Developer Mode
    </button>
  )
}
