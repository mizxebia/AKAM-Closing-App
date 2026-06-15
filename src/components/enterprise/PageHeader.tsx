import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  gradient?: string
  dark?: boolean
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  gradient,
  dark = false,
}: PageHeaderProps) {
  return (
    <motion.header
      className={cn(
        'flex flex-col gap-2 border border-[#D5CBB8] px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between',
        gradient ? '' : 'bg-white',
        className
      )}
      style={{
        borderRadius: className?.includes('rounded-none') ? '0' : '12px',
        ...(gradient ? { background: gradient } : {}),
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p
            className="mb-2 font-semibold uppercase"
            style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#C9A96E' }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="truncate text-2xl tracking-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontStyle: 'italic',
            color: dark ? '#F5F2EC' : '#1E3A47',
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="mt-1 max-w-3xl text-sm leading-5"
            style={{ color: dark ? 'rgba(245,242,236,0.75)' : '#4B5563' }}
          >
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
