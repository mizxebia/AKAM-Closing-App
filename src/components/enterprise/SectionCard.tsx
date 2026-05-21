import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface SectionCardProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <motion.section
      className={cn(
        'border border-[#D5CBB8] bg-white shadow-sm',
        className
      )}
      style={{ borderRadius: '12px' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      {(title || description || actions) && (
        <div className="flex flex-col gap-2 border-b border-[#E2DAD0] px-4 py-2.5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            {title && (
              <h2
                className="text-[#1E3A47]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, fontSize: '17px' }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 leading-5 text-[#4B5563]" style={{ fontSize: '12px' }}>
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="p-3">{children}</div>
    </motion.section>
  )
}
