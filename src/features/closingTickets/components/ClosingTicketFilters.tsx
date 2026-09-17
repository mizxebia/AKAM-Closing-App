import { SearchFilter } from '../../../components/filters/SearchFilter'
import { closingTicketStatusOptions } from '../utils/closingTicketFormatters'
import {
  CLOSING_DOCUMENT_FILTER_OPTIONS,
  BOT_STATUS_FILTER_OPTIONS,
  PACKAGE_TYPE_FILTER_OPTIONS,
} from '../utils/closingTicketFilters'
import type { ClosingTicketFilters } from '../types/closingTicket'

interface ClosingTicketFiltersProps {
  filters: ClosingTicketFilters
  onStatusChange: (
    value: ClosingTicketFilters['status']
  ) => void
  onSearchChange: (value: string) => void
  /** Developer Mode only — lets a developer find tickets missing/having a specific document. */
  showDocumentFilter?: boolean
  onDocumentFilterChange: (value: string) => void
  /** Developer Mode only — lets a developer find tickets with/without Yardi charges. */
  showChargesFilter?: boolean
  onChargesFilterChange: (
    value: ClosingTicketFilters['chargesFilter']
  ) => void
  /** Developer Mode only — lets a developer find tickets by their Bot Status. */
  showBotStatusFilter?: boolean
  onBotStatusFilterChange: (
    value: ClosingTicketFilters['botStatusFilter']
  ) => void
  /** Developer Mode only — lets a developer find tickets by their Package Type. */
  showPackageTypeFilter?: boolean
  onPackageTypeFilterChange: (
    value: ClosingTicketFilters['packageTypeFilter']
  ) => void
}

export function ClosingTicketFilters({
  filters,
  onStatusChange,
  onSearchChange,
  showDocumentFilter = false,
  onDocumentFilterChange,
  showChargesFilter = false,
  onChargesFilterChange,
  showBotStatusFilter = false,
  onBotStatusFilterChange,
  showPackageTypeFilter = false,
  onPackageTypeFilterChange,
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

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] sm:items-end">
        <SearchFilter
          id="closing-ticket-general-search"
          label="Search closings"
          placeholder="Search closings by ID, building, unit, status, buyer, seller..."
          value={filters.search}
          onChange={onSearchChange}
        />

        {showDocumentFilter && (
          <label
            className="flex flex-col gap-1 text-xs font-medium text-[#5F5E5A]"
            htmlFor="closing-ticket-document-filter"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Documents
            </span>
            <select
              id="closing-ticket-document-filter"
              className="h-9 min-w-[220px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
              value={filters.documentFilter}
              onChange={(event) =>
                onDocumentFilterChange(event.target.value)
              }
            >
              <option value="">All documents</option>
              {CLOSING_DOCUMENT_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {showChargesFilter && (
          <label
            className="flex flex-col gap-1 text-xs font-medium text-[#5F5E5A]"
            htmlFor="closing-ticket-charges-filter"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Yardi Charges
            </span>
            <select
              id="closing-ticket-charges-filter"
              className="h-9 min-w-[220px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
              value={filters.chargesFilter}
              onChange={(event) =>
                onChargesFilterChange(
                  event.target
                    .value as ClosingTicketFilters['chargesFilter']
                )
              }
            >
              <option value="">All</option>
              <option value="present">Has Yardi Charges</option>
              <option value="missing">Missing Yardi Charges</option>
            </select>
          </label>
        )}

        {showBotStatusFilter && (
          <label
            className="flex flex-col gap-1 text-xs font-medium text-[#5F5E5A]"
            htmlFor="closing-ticket-bot-status-filter"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Bot Status
            </span>
            <select
              id="closing-ticket-bot-status-filter"
              className="h-9 min-w-[220px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
              value={filters.botStatusFilter}
              onChange={(event) =>
                onBotStatusFilterChange(
                  event.target.value === ''
                    ? ''
                    : Number(event.target.value)
                )
              }
            >
              <option value="">All bot statuses</option>
              {BOT_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {showPackageTypeFilter && (
          <label
            className="flex flex-col gap-1 text-xs font-medium text-[#5F5E5A]"
            htmlFor="closing-ticket-package-type-filter"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Package Type
            </span>
            <select
              id="closing-ticket-package-type-filter"
              className="h-9 min-w-[220px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
              value={filters.packageTypeFilter}
              onChange={(event) =>
                onPackageTypeFilterChange(
                  event.target.value === ''
                    ? ''
                    : Number(event.target.value)
                )
              }
            >
              <option value="">All package types</option>
              {PACKAGE_TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </section>
  )
}
