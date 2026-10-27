import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Rows2,
  Rows3,
} from 'lucide-react'
import {
  Avatar,
  SectionCard,
  StatusBadge as EnterpriseStatusBadge,
} from '../../../components/enterprise'
import type {
  ClosingTicketColumn,
  ClosingTicketColumnKey,
  ClosingTicketRecord,
} from '../types/closingTicket'
import {
  formatClosingTicketValue,
  getClosingTicketStatusDisplay,
} from '../utils/closingTicketFormatters'
import { getBotStatusLabel } from '../../devTools/utils/statusOptions'
import { formatGeneratedLabel } from '../../invoices/utils/invoiceFormatters'
import { getFailureReason } from '../utils/closingTicketFailureReasons'

const PAGE_SIZE = 20

type SortDirection = 'asc' | 'desc'
type Density = 'compact' | 'comfortable'

const DENSITY_STORAGE_KEY = 'akam-table-density'

function readStoredDensity(): Density {
  try {
    const stored = window.localStorage.getItem(
      DENSITY_STORAGE_KEY
    )
    return stored === 'comfortable' ? 'comfortable' : 'compact'
  } catch {
    return 'compact'
  }
}

function storeDensity(density: Density) {
  try {
    window.localStorage.setItem(DENSITY_STORAGE_KEY, density)
  } catch {
    // Ignore — worst case the preference isn't remembered next visit.
  }
}

const DENSITY_STYLES: Record<
  Density,
  {
    rowHeight: string
    cellPadding: string
    headerPadding: string
    fontSize: string
  }
> = {
  compact: {
    rowHeight: '28px',
    cellPadding: 'px-3 py-1',
    headerPadding: 'px-3 py-1.5',
    fontSize: '11px',
  },
  comfortable: {
    rowHeight: '34px',
    cellPadding: 'px-4 py-1.5',
    headerPadding: 'px-4 py-2.5',
    fontSize: '12px',
  },
}

// Columns whose values are naturally ordered newest/highest-first on first
// click; everything else defaults to A-Z on first click.
const DATE_COLUMNS = new Set<ClosingTicketColumnKey>([
  'createdon',
  'modifiedon',
])

type SortKey = ClosingTicketColumnKey | 'archived'

function getSortValue(
  record: ClosingTicketRecord,
  key: SortKey
): string | number {
  switch (key) {
    case 'createdon':
    case 'modifiedon': {
      const raw = record[key]
      return raw ? new Date(raw).getTime() : 0
    }
    case 'cr7de_ticketstatus':
      return Number(record.cr7de_ticketstatus ?? -1)
    case 'cr109_botstatus':
      return record.cr109_botstatus !== undefined &&
        String(record.cr109_botstatus).trim() !== ''
        ? Number(record.cr109_botstatus)
        : -1
    case 'failureReason':
      return (getFailureReason(record) ?? '').toLowerCase()
    case 'archived':
      return record.cr109_archivalstatus ? 1 : 0
    default:
      return String(
        formatClosingTicketValue(record, key) ?? ''
      ).toLowerCase()
  }
}

interface ClosingTicketTableProps {
  records: ClosingTicketRecord[]
  columns: ClosingTicketColumn[]
  onRecordSelect: (recordId: string) => void
  /** Developer Mode bulk-select — shows a checkbox column when true. */
  selectable?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (recordId: string) => void
  onToggleSelectAll?: (recordIds: string[]) => void
  /** Developer Mode only — shows an Archive/Unarchive action column. */
  showArchiveActions?: boolean
  onToggleArchive?: (
    recordId: string,
    nextArchived: boolean
  ) => void
}

export function ClosingTicketTable({
  records,
  columns,
  onRecordSelect,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  showArchiveActions = false,
  onToggleArchive,
}: ClosingTicketTableProps) {
  const [page, setPage] = useState(0)
  const [density, setDensity] = useState<Density>(
    readStoredDensity
  )
  const densityStyle = DENSITY_STYLES[density]

  const toggleDensity = () => {
    setDensity((current) => {
      const next =
        current === 'compact' ? 'comfortable' : 'compact'
      storeDensity(next)
      return next
    })
  }
  const [sortColumn, setSortColumn] =
    useState<SortKey>('createdon')
  const [sortDirection, setSortDirection] =
    useState<SortDirection>('desc')

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const av = getSortValue(a, sortColumn)
      const bv = getSortValue(b, sortColumn)
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [records, sortColumn, sortDirection])

  useEffect(() => {
    setPage(0)
  }, [records, sortColumn, sortDirection])

  const handleSortClick = (key: SortKey) => {
    if (key === sortColumn) {
      setSortDirection((current) =>
        current === 'asc' ? 'desc' : 'asc'
      )
      return
    }

    setSortColumn(key)
    setSortDirection(
      DATE_COLUMNS.has(key as ClosingTicketColumnKey) ? 'desc' : 'asc'
    )
  }

  const pageCount = Math.ceil(sortedRecords.length / PAGE_SIZE)
  const pageRecords = sortedRecords.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  )
  const start = page * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE + PAGE_SIZE, sortedRecords.length)

  return (
    <SectionCard
      title="Recent Closings"
      description={`${records.length} records match the current view. Click a column header to sort.`}
      className="overflow-hidden"
      actions={
        <button
          type="button"
          onClick={toggleDensity}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#D5CBB8] bg-white px-2.5 text-xs font-semibold text-[#1E3A47] transition hover:bg-[#F5F2EC]"
          title={
            density === 'compact'
              ? 'Switch to comfortable row spacing'
              : 'Switch to compact row spacing'
          }
        >
          {density === 'compact' ? (
            <Rows3 className="size-3.5" />
          ) : (
            <Rows2 className="size-3.5" />
          )}
          {density === 'compact' ? 'Compact' : 'Comfortable'}
        </button>
      }
    >
      <div className="-m-3 overflow-x-auto">
        <table className="min-w-[1100px] w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-[1] bg-[#EDE8E0]">
            <tr>
              {selectable && (
                <th
                  className={`border-b border-[#D5CBB8] ${densityStyle.headerPadding} text-left`}
                  style={{ width: '40px' }}
                >
                  <input
                    type="checkbox"
                    aria-label="Select all rows on this page"
                    checked={
                      pageRecords.length > 0 &&
                      pageRecords.every((r) =>
                        selectedIds?.has(
                          r.cr7de_closingticketdetailsid
                        )
                      )
                    }
                    onChange={() =>
                      onToggleSelectAll?.(
                        pageRecords.map(
                          (r) => r.cr7de_closingticketdetailsid
                        )
                      )
                    }
                  />
                </th>
              )}
              {columns.map((column) => {
                const isActive = column.key === sortColumn
                const SortIcon = !isActive
                  ? ArrowUpDown
                  : sortDirection === 'asc'
                    ? ArrowUp
                    : ArrowDown

                return (
                  <th
                    key={column.key}
                    className={`overflow-hidden border-b border-[#D5CBB8] ${densityStyle.headerPadding} text-left font-semibold uppercase text-[#5F5E5A]`}
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      width: column.width,
                      maxWidth: column.width,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSortClick(column.key)}
                      className={`flex w-full min-w-0 items-center gap-1 transition hover:text-[#1E3A47] ${
                        isActive ? 'text-[#1E3A47]' : ''
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        {column.label}
                      </span>
                      <SortIcon className="size-3 shrink-0" />
                    </button>
                  </th>
                )
              })}
              {showArchiveActions && (
                <th
                  className={`overflow-hidden border-b border-[#D5CBB8] ${densityStyle.headerPadding} text-left font-semibold uppercase text-[#5F5E5A]`}
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    width: '110px',
                    maxWidth: '110px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSortClick('archived')}
                    className={`flex w-full min-w-0 items-center gap-1 transition hover:text-[#1E3A47] ${
                      sortColumn === 'archived' ? 'text-[#1E3A47]' : ''
                    }`}
                  >
                    <span className="min-w-0 truncate">Archive</span>
                    {sortColumn !== 'archived' ? (
                      <ArrowUpDown className="size-3 shrink-0" />
                    ) : sortDirection === 'asc' ? (
                      <ArrowUp className="size-3 shrink-0" />
                    ) : (
                      <ArrowDown className="size-3 shrink-0" />
                    )}
                  </button>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {pageRecords.map((record) => (
              <tr
                key={record.cr7de_closingticketdetailsid}
                className="cursor-pointer odd:bg-white even:bg-[#faf8f4] transition hover:bg-[#F5F2EC] focus:outline-none focus:ring-2 focus:ring-[#D5CBB8]"
                style={{ height: densityStyle.rowHeight }}
                onClick={() =>
                  onRecordSelect(
                    record.cr7de_closingticketdetailsid
                  )
                }
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault()
                    onRecordSelect(
                      record.cr7de_closingticketdetailsid
                    )
                  }
                }}
              >
                {selectable && (
                  <td
                    className={`border-b border-[#EDE8E0] ${densityStyle.cellPadding}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select ticket ${record.cr7de_ticketid ?? ''}`}
                      checked={Boolean(
                        selectedIds?.has(
                          record.cr7de_closingticketdetailsid
                        )
                      )}
                      onChange={() =>
                        onToggleSelect?.(
                          record.cr7de_closingticketdetailsid
                        )
                      }
                    />
                  </td>
                )}
                {columns.map((column, colIndex) => {
                  const failureReason =
                    column.key === 'failureReason'
                      ? getFailureReason(record)
                      : null

                  return (
                    <td
                      key={column.key}
                      title={failureReason ?? undefined}
                      className={`max-w-[220px] truncate text-[#4B5563] first:font-semibold first:text-[#1E3A47] ${densityStyle.cellPadding}${colIndex > 0 ? ' border-b border-[#EDE8E0]' : ''}`}
                      style={{ fontSize: densityStyle.fontSize }}
                    >
                      {column.key === 'cr7de_ticketstatus' ? (
                        <StatusBadge record={record} />
                      ) : column.key === 'cr109_botstatus' ? (
                        <BotStatusBadge record={record} />
                      ) : column.key === 'failureReason' ? (
                        failureReason ?? (
                          <span className="text-[#B0B5BC]">—</span>
                        )
                      ) : column.key === 'createdbyname' ? (
                        <CreatedByCell record={record} />
                      ) : (
                        formatClosingTicketValue(record, column.key)
                      )}
                    </td>
                  )
                })}
                {showArchiveActions && (
                  <td
                    className={`border-b border-[#EDE8E0] ${densityStyle.cellPadding}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="inline-flex h-6 items-center rounded-md border border-[#D5CBB8] bg-white px-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#1E3A47] hover:bg-[#F5F2EC]"
                      onClick={() =>
                        onToggleArchive?.(
                          record.cr7de_closingticketdetailsid,
                          !record.cr109_archivalstatus
                        )
                      }
                    >
                      {record.cr109_archivalstatus
                        ? 'Unarchive'
                        : 'Archive'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-[#EDE8E0] pt-3">
          <p className="text-xs text-[#4B5563]">
            Showing <span className="font-semibold text-[#1E3A47]">{start}–{end}</span> of{' '}
            <span className="font-semibold text-[#1E3A47]">{sortedRecords.length}</span> records
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D5CBB8] bg-white text-[#1E3A47] transition hover:bg-[#F5F2EC] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                  i === page
                    ? 'border-[#1E3A47] bg-[#1E3A47] text-[#F5F2EC]'
                    : 'border-[#D5CBB8] bg-white text-[#4B5563] hover:bg-[#F5F2EC]'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page === pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D5CBB8] bg-white text-[#1E3A47] transition hover:bg-[#F5F2EC] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function StatusBadge({
  record,
}: {
  record: ClosingTicketRecord
}) {
  const status = getClosingTicketStatusDisplay(
    record.cr7de_ticketstatus
  )

  return (
    <EnterpriseStatusBadge
      label={status.label}
      tone={status.tone}
    />
  )
}

function BotStatusBadge({
  record,
}: {
  record: ClosingTicketRecord
}) {
  if (
    record.cr109_botstatus === undefined ||
    String(record.cr109_botstatus).trim() === ''
  ) {
    return <span className="text-[#B0B5BC]">—</span>
  }

  return (
    <EnterpriseStatusBadge
      label={formatGeneratedLabel(
        getBotStatusLabel(Number(record.cr109_botstatus))
      )}
      tone="default"
    />
  )
}

function CreatedByCell({
  record,
}: {
  record: ClosingTicketRecord
}) {
  const name = formatClosingTicketValue(record, 'createdbyname')
  const label = name === '-' ? null : name

  return (
    <span className="flex items-center gap-1.5">
      <Avatar name={label} size="xs" />
      <span className="truncate">{label ?? '-'}</span>
    </span>
  )
}
