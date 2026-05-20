import { cn } from '../../lib/utils'

type StatusTone =
  | 'draft'
  | 'processing'
  | 'postClosing'
  | 'validate'
  | 'completed'
  | 'default'

interface StatusBadgeProps {
  label: string
  tone?: StatusTone
}

const toneClasses: Record<StatusTone, string> = {
  draft: 'border-slate-200 bg-slate-50 text-slate-700',
  processing: 'border-blue-200 bg-blue-50 text-blue-700',
  postClosing: 'border-amber-200 bg-amber-50 text-amber-700',
  validate: 'border-violet-200 bg-violet-50 text-violet-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  default: 'border-slate-200 bg-white text-slate-600',
}

export function StatusBadge({
  label,
  tone = 'default',
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold leading-none tracking-wide',
        toneClasses[tone]
      )}
    >
      {label}
    </span>
  )
}
