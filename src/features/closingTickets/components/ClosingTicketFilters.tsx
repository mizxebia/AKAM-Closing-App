import { Search } from 'lucide-react'
import { SearchFilter } from '../../../components/filters/SearchFilter'
import { closingTicketStatusOptions } from '../utils/closingTicketFormatters'
import type { ClosingTicketFilters } from '../types/closingTicket'

interface ClosingTicketFiltersProps {
  filters: ClosingTicketFilters
  onStatusChange: (
    value: ClosingTicketFilters['status']
  ) => void
  onBuildingCodeChange: (value: string) => void
  onUnitChange: (value: string) => void
}

export function ClosingTicketFilters({
  filters,
  onStatusChange,
  onBuildingCodeChange,
  onUnitChange,
}: ClosingTicketFiltersProps) {
  return (
    <section className="sticky top-0 z-10 grid gap-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/60 backdrop-blur">
      <div
        className="flex flex-wrap gap-2"
        aria-label="Filter closings by status"
      >
        {closingTicketStatusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              filters.status === option.value
                ? 'rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm'
                : 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50'
            }
            onClick={() =>
              onStatusChange(option.value)
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <SearchFilter
            id="closing-ticket-building-code"
            label="Filter by building code"
            placeholder="Filter by building code..."
            value={filters.buildingCode}
            onChange={onBuildingCodeChange}
          />
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <SearchFilter
            id="closing-ticket-unit"
            label="Filter by unit ID"
            placeholder="Filter by unit ID..."
            value={filters.unit}
            onChange={onUnitChange}
          />
        </div>
      </div>
    </section>
  )
}
