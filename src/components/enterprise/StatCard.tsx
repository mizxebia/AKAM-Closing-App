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
        padding: '16px 20px',
        ...(accentColor ? { borderLeft: `3px solid ${accentColor}` } : {}),
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="font-semibold uppercase text-[#4B5563]"
            style={{ fontSize: '10px', letterSpacing: '0.12em' }}
          >
            {label}
          </p>
          <strong
            className="mt-2 block font-semibold tracking-tight text-[#1E3A47]"
            style={{ fontSize: '32px', lineHeight: 1.1 }}
          >
            {value}
          </strong>
          <p className="mt-1 text-sm text-[#4B5563]">
            {description}
          </p>
        </div>
        <div
          className="grid shrink-0 place-items-center bg-[#E8EFF2] text-[#1E3A47]"
          style={{ width: '36px', height: '36px', borderRadius: '6px', flexShrink: 0 }}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#4B5563]">
        <TrendingUp className="size-3.5 text-[#1a7a52]" />
        <span>{trend}</span>
      </div>
    </motion.article>
  )
}
