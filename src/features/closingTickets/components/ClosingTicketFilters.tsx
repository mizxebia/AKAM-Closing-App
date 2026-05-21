import { Search } from 'lucide-react'
import { SearchFilter } from '../../../components/filters/SearchFilter'
import { closingTicketStatusOptions } from '../utils/closingTicketFormatters'
import type { ClosingTicketFilters } from '../types/closingTicket'

interface ClosingTicketFiltersProps {
  filters: ClosingTicketFilters
  onStatusChange: (
    value: ClosingTicketFilters['status']
  ) => void
  onSearchChange: (value: string) => void
}

export function ClosingTicketFilters({
  filters,
  onStatusChange,
  onSearchChange,
}: ClosingTicketFiltersProps) {
  return (
    <section
      className="sticky top-[48px] z-10 grid gap-2 border border-[#E2DAD0] bg-white px-3 py-2 shadow-sm"
      style={{ borderRadius: '12px' }}
    >
      <div
        className="flex flex-wrap gap-1"
        aria-label="Filter closings by status"
      >
        {closingTicketStatusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              filters.status === option.value
                ? 'px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#F5F2EC] transition'
                : 'px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5F5E5A] transition hover:text-[#1E3A47]'
            }
            style={
              filters.status === option.value
                ? {
                    backgroundColor: '#1E3A47',
                    borderRadius: '6px',
                  }
                : {
                    background: 'transparent',
                    borderRadius: '6px',
                  }
            }
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#4B5563]" />
          <SearchFilter
            id="closing-ticket-general-search"
            label="Search closings"
            placeholder="Search closings by ID, building, unit, status, buyer, seller..."
            value={filters.search}
            onChange={onSearchChange}
          />
        </div>
      </div>
    </section>
  )
}
