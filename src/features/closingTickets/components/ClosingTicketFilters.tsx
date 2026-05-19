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
    <section className="closing-filters">
      <div
        className="status-tabs"
        aria-label="Filter closings by status"
      >
        {closingTicketStatusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              filters.status === option.value
                ? 'status-tab status-tab-active'
                : 'status-tab'
            }
            onClick={() =>
              onStatusChange(option.value)
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="filter-search-grid">
        <SearchFilter
          id="closing-ticket-building-code"
          label="Filter by building code"
          placeholder="Filter by building code..."
          value={filters.buildingCode}
          onChange={onBuildingCodeChange}
        />
        <SearchFilter
          id="closing-ticket-unit"
          label="Filter by unit ID"
          placeholder="Filter by unit ID..."
          value={filters.unit}
          onChange={onUnitChange}
        />
      </div>
    </section>
  )
}
