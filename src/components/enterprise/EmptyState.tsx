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
    <div
      className="grid min-h-48 place-items-center border border-dashed border-[#C8BBA9] bg-white p-8 text-center"
      style={{ borderRadius: '12px' }}
    >
      <div>
        <div
          className="mx-auto grid size-11 place-items-center bg-[#E2DAD0] text-[#1E3A47] ring-1 ring-[#D5CBB8]"
          style={{ borderRadius: '2px' }}
        >
          <Icon className="size-5" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-[#1E3A47]">
          {title}
        </h3>
        {description && (
          <p className="mt-1 max-w-md text-sm leading-6 text-[#4B5563]">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
