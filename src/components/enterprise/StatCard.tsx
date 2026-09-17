import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  description: string
  icon: ComponentType<{ className?: string }>
  tone?: 'blue' | 'violet' | 'emerald' | 'amber'
  trend?: string
  accentColor?: string
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  trend = 'Live',
  accentColor,
}: StatCardProps) {
  return (
    <motion.article
      className="group border border-[#D5CBB8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#C8BBA9] hover:shadow-md"
      style={{
        borderRadius: '12px',
        padding: '8px 12px',
        ...(accentColor ? { borderLeft: `3px solid ${accentColor}` } : {}),
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-semibold uppercase text-[#4B5563]"
            style={{ fontSize: '9px', letterSpacing: '0.1em' }}
            title={label}
          >
            {label}
          </p>
          <strong
            className="mt-0.5 block font-semibold tracking-tight text-[#1E3A47]"
            style={{ fontSize: '20px', lineHeight: 1.1 }}
          >
            {value}
          </strong>
          <p className="truncate text-xs text-[#4B5563]" title={description}>
            {description}
          </p>
        </div>
        <div
          className="grid shrink-0 place-items-center bg-[#E8EFF2] text-[#1E3A47]"
          style={{ width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0 }}
        >
          <Icon className="size-3.5" />
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#4B5563]">
        <TrendingUp className="size-3.5 shrink-0 text-[#1a7a52]" />
        <span className="truncate">{trend}</span>
      </div>
    </motion.article>
  )
}
