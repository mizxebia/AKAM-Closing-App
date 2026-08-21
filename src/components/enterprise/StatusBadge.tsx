import type { CSSProperties } from 'react'
import { cn } from '../../lib/utils'

type StatusTone =
  | 'draft'
  | 'processing'
  | 'postClosing'
  | 'validate'
  | 'completed'
  | 'failed'
  | 'sentToAR'
  | 'default'

interface StatusBadgeProps {
  label: string
  tone?: StatusTone
}

const toneStyles: Record<StatusTone, CSSProperties> = {
  draft: {
    backgroundColor: '#F1EFE8',
    color: '#5F5E5A',
    border: '1px solid #B4B2A9',
  },
  processing: {
    backgroundColor: '#E1F5EE',
    color: '#0F6E56',
    border: '1px solid #5DCAA5',
  },
  postClosing: {
    backgroundColor: '#FAECE7',
    color: '#8B3A2A',
    border: '1px solid #F0997B',
  },
  validate: {
    backgroundColor: '#FAECE7',
    color: '#8B3A2A',
    border: '1px solid #F0997B',
  },
  completed: {
    backgroundColor: '#E1F5EE',
    color: '#0F6E56',
    border: '1px solid #5DCAA5',
  },
  failed: {
    backgroundColor: '#FEF2F2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
  },
  sentToAR: {
    backgroundColor: '#EFF6FF',
    color: '#1d4ed8',
    border: '1px solid #93c5fd',
  },
  default: {
    backgroundColor: '#F1EFE8',
    color: '#5F5E5A',
    border: '1px solid #B4B2A9',
  },
}

export function StatusBadge({
  label,
  tone = 'default',
}: StatusBadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center font-semibold uppercase')}
      style={{
        ...toneStyles[tone],
        borderRadius: '4px',
        fontSize: '11px',
        letterSpacing: '0.05em',
        padding: '3px 10px',
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  )
}
