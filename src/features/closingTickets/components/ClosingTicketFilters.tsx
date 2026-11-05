import {
  Building2,
  CheckCircle2,
  Clock,
  FileCheck,
  FileEdit,
  LayoutGrid,
  Send,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useMemo } from 'react'
import type { ComponentType } from 'react'
import { SearchFilter } from '../../../components/filters/SearchFilter'
import {
  closingTicketStatusOptions,
  formatClosingTicketStatus,
} from '../utils/closingTicketFormatters'
import {
  CLOSING_DOCUMENT_FILTER_OPTIONS,
  BOT_STATUS_FILTER_OPTIONS,
  PACKAGE_TYPE_FILTER_OPTIONS,
} from '../utils/closingTicketFilters'
import { isEffectivelyArchived } from '../utils/closingTicketArchiving'
import { developerOnlyClosingTicketTabs } from '../constants/closingTicketMetadata'
import { PROCESS_CHECKPOINT_STAGES } from '../constants/processCheckpoints'
import type {
  ClosingTicketFilters,
  ClosingTicketRecord,
} from '../types/closingTicket'

const STATUS_TAB_ICONS: Record<
  string,
  ComponentType<{ className?: string }>
> = {
  All: LayoutGrid,
  'My Tickets': UserRound,
  Draft: FileEdit,
  Processing: Clock,
  'Ready for Post Closing': ShieldCheck,
  'Post Closing': FileCheck,
  'Validate Closings': ShieldCheck,
  'Transferring Building': Building2,
  Completed: CheckCircle2,
  'Sent to AR': Send,
  Failed: XCircle,
}

interface ClosingTicketFiltersProps {
  filters: ClosingTicketFilters
  /** Full, unfiltered record set — used only to show a per-tab count badge. */
  records: ClosingTicketRecord[]
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
  /**
   * Developer Mode only — a dropdown of process-lifecycle checkpoints
   * (Draft -> ... -> Sent To AR), ordered by stage rather than the raw
   * Dataverse option-set order, alongside the Bot Status dropdown above.
   * Shares the same botStatusFilter value/setter as that dropdown.
   */
  showCheckpointSlicer?: boolean
  /** Developer Mode only — lets a developer find tickets by their Package Type. */
  showPackageTypeFilter?: boolean
  onPackageTypeFilterChange: (
    value: ClosingTicketFilters['packageTypeFilter']
  ) => void
  /** Developer Mode only — also show the internal Processing / Transferring Building status tabs. */
  showDeveloperStatusTabs?: boolean
  /** Developer Mode only — lets a developer find tickets by a Closing Date range. */
  showClosingDateFilter?: boolean
  onClosingDateFilterChange: (
    value: Partial<ClosingTicketFilters['closingDateFilter']>
  ) => void
  /** Developer Mode only — bypasses the archived-ticket hide rule entirely. */
  showArchivedToggle?: boolean
  onShowArchivedChange: (value: boolean) => void
}

export function ClosingTicketFilters({
  filters,
  records,
  onStatusChange,
  onSearchChange,
  showDocumentFilter = false,
  onDocumentFilterChange,
  showChargesFilter = false,
  onChargesFilterChange,
  showBotStatusFilter = false,
  onBotStatusFilterChange,
  showCheckpointSlicer = false,
  showPackageTypeFilter = false,
  onPackageTypeFilterChange,
  showDeveloperStatusTabs = false,
  showClosingDateFilter = false,
  onClosingDateFilterChange,
  showArchivedToggle = false,
  onShowArchivedChange,
}: ClosingTicketFiltersProps) {
  const visibleStatusOptions = showDeveloperStatusTabs
    ? closingTicketStatusOptions.filter(
        (option) => option.value !== 'My Tickets'
      )
    : closingTicketStatusOptions.filter(
        (option) => !developerOnlyClosingTicketTabs.has(option.value)
      )

  // Per-tab counts against the full record set (not the other active
  // filters) — "My Tickets" is skipped since matching it needs the current
  // user's identity, which isn't available here. The archived-ticket rule
  // IS applied, though, matching exactly what filterClosingTickets does for
  // the gallery — otherwise a tab could claim records the gallery is
  // actually hiding (or vice versa once Show Archived is on).
  const tabCounts = useMemo(() => {
    const visibleRecords = records.filter(
      (record) => filters.showArchived || !isEffectivelyArchived(record)
    )
    const counts: Record<string, number> = { All: visibleRecords.length }
    for (const record of visibleRecords) {
      const label = formatClosingTicketStatus(
        record.cr7de_ticketstatus
      )
      counts[label] = (counts[label] ?? 0) + 1
    }
    return counts
  }, [records, filters.showArchived])

  // Same per-checkpoint counting rule as tabCounts above, just keyed by
  // Bot Status value instead of Ticket Status label.
  const checkpointCounts = useMemo(() => {
    const visibleRecords = records.filter(
      (record) => filters.showArchived || !isEffectivelyArchived(record)
    )
    const counts: Record<number, number> = {}
    for (const record of visibleRecords) {
      const value = Number(record.cr109_botstatus)
      if (!Number.isNaN(value)) {
        counts[value] = (counts[value] ?? 0) + 1
      }
    }
    return counts
  }, [records, filters.showArchived])

  return (
    <section
      className="sticky top-[48px] z-10 grid gap-1.5 border border-[#E2DAD0] bg-white px-3 py-1.5 shadow-sm"
      style={{ borderRadius: '12px' }}
    >
      <div
        className="flex flex-nowrap items-center gap-0.5 overflow-x-auto"
        aria-label="Filter closings by status"
      >
        {visibleStatusOptions.map((option) => {
          const Icon = STATUS_TAB_ICONS[option.value] ?? LayoutGrid
          const count = tabCounts[option.value]
          return (
            <button
              key={option.value}
              type="button"
              className={
                filters.status === option.value
                  ? 'inline-flex shrink-0 items-center gap-1 px-1.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.04em] text-[#F5F2EC] transition'
                  : 'inline-flex shrink-0 items-center gap-1 px-1.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.04em] text-[#5F5E5A] transition hover:text-[#1E3A47]'
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
              <Icon className="size-2.5 shrink-0" />
              {option.label}
              {count !== undefined && (
                <span
                  className={
                    filters.status === option.value
                      ? 'rounded-full bg-[rgba(245,242,236,0.2)] px-1 text-[9px] font-semibold'
                      : 'rounded-full bg-[#F1EFE8] px-1 text-[9px] font-semibold text-[#8a8578]'
                  }
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <SearchFilter
            id="closing-ticket-general-search"
            label="Search closings"
            placeholder="Search closings by ID, building, unit, status, buyer, seller..."
            value={filters.search}
            onChange={onSearchChange}
          />
        </div>

        {showArchivedToggle && (
          <label
            className="flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-[#D5CBB8] bg-white px-2.5 text-xs font-medium text-[#1E3A47]"
            htmlFor="closing-ticket-show-archived"
          >
            <input
              id="closing-ticket-show-archived"
              type="checkbox"
              className="size-3.5 accent-[#1E3A47]"
              checked={filters.showArchived}
              onChange={(event) =>
                onShowArchivedChange(event.target.checked)
              }
            />
            Show Archived
          </label>
        )}
      </div>

      {(showDocumentFilter ||
        showChargesFilter ||
        showBotStatusFilter ||
        showCheckpointSlicer ||
        showPackageTypeFilter ||
        showClosingDateFilter) && (
        <div className="flex flex-wrap items-end gap-2">
          {showDocumentFilter && (
            <label
              className="flex flex-col gap-0.5 text-xs font-medium text-[#5F5E5A]"
              htmlFor="closing-ticket-document-filter"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                Documents
              </span>
              <select
                id="closing-ticket-document-filter"
                className="h-8 min-w-[170px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
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
              className="flex flex-col gap-0.5 text-xs font-medium text-[#5F5E5A]"
              htmlFor="closing-ticket-charges-filter"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                Yardi Charges
              </span>
              <select
                id="closing-ticket-charges-filter"
                className="h-8 min-w-[170px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
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
              className="flex flex-col gap-0.5 text-xs font-medium text-[#5F5E5A]"
              htmlFor="closing-ticket-bot-status-filter"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                Bot Status
              </span>
              <select
                id="closing-ticket-bot-status-filter"
                className="h-8 min-w-[170px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
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

          {showCheckpointSlicer && (
            <label
              className="flex flex-col gap-0.5 text-xs font-medium text-[#5F5E5A]"
              htmlFor="closing-ticket-checkpoint-filter"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                Checkpoint
              </span>
              <select
                id="closing-ticket-checkpoint-filter"
                className="h-8 min-w-[170px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
                value={filters.botStatusFilter}
                onChange={(event) =>
                  onBotStatusFilterChange(
                    event.target.value === ''
                      ? ''
                      : Number(event.target.value)
                  )
                }
              >
                <option value="">All checkpoints</option>
                {PROCESS_CHECKPOINT_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                    {checkpointCounts[stage.value] !== undefined
                      ? ` (${checkpointCounts[stage.value]})`
                      : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showPackageTypeFilter && (
            <label
              className="flex flex-col gap-0.5 text-xs font-medium text-[#5F5E5A]"
              htmlFor="closing-ticket-package-type-filter"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                Package Type
              </span>
              <select
                id="closing-ticket-package-type-filter"
                className="h-8 min-w-[170px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
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

          {showClosingDateFilter && (
            <div className="flex flex-col gap-0.5 text-xs font-medium text-[#5F5E5A]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                Closing Date
              </span>
              <div className="flex items-center gap-1">
                <label className="sr-only" htmlFor="closing-ticket-closing-date-from">
                  Closing date from
                </label>
                <input
                  id="closing-ticket-closing-date-from"
                  type="date"
                  className="h-8 w-[130px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
                  value={filters.closingDateFilter.from}
                  max={filters.closingDateFilter.to || undefined}
                  onChange={(event) =>
                    onClosingDateFilterChange({ from: event.target.value })
                  }
                />
                <span className="text-[#94a3b8]">to</span>
                <label className="sr-only" htmlFor="closing-ticket-closing-date-to">
                  Closing date to
                </label>
                <input
                  id="closing-ticket-closing-date-to"
                  type="date"
                  className="h-8 w-[130px] rounded-md border border-[#D5CBB8] bg-white px-2 text-xs text-[#1E3A47]"
                  value={filters.closingDateFilter.to}
                  min={filters.closingDateFilter.from || undefined}
                  onChange={(event) =>
                    onClosingDateFilterChange({ to: event.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

    </section>
  )
}
