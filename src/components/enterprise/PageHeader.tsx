import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.header
      className={cn(
        'sticky top-0 z-50 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/60 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:flex-row md:items-center md:justify-between',
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {eyebrow}
          </p>
        )}
        <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </motion.header>
  )
}
