import type { ComponentType } from 'react'
import { FileSearch } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ComponentType<{ className?: string }>
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileSearch,
}: EmptyStateProps) {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div>
        <div className="mx-auto grid size-11 place-items-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200">
          <Icon className="size-5" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-slate-950">
          {title}
        </h3>
        {description && (
          <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
