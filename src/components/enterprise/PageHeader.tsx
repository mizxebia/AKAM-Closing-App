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
        'flex flex-col gap-4 border border-[#D5CBB8] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between',
        className
      )}
      style={{ borderRadius: '12px' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p
            className="mb-2 font-semibold uppercase"
            style={{ fontSize: '13px', letterSpacing: '0.12em', color: '#C9A96E' }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="truncate text-2xl tracking-tight text-[#1E3A47] md:text-3xl"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontStyle: 'italic' }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[#4B5563]">
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
