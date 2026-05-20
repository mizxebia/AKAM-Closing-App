import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'

type StatTone = 'blue' | 'violet' | 'emerald' | 'amber'

interface StatCardProps {
  label: string
  value: string | number
  description: string
  icon: ComponentType<{ className?: string }>
  tone?: StatTone
  trend?: string
}

const toneClasses: Record<StatTone, string> = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'blue',
  trend = 'Live',
}: StatCardProps) {
  return (
    <motion.article
      className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <strong className="mt-3 block text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </strong>
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
        <div
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-lg ring-1',
            toneClasses[tone]
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <TrendingUp className="size-3.5 text-emerald-500" />
        <span>{trend}</span>
      </div>
    </motion.article>
  )
}
