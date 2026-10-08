import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  RefreshCw,
  X,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import {
  getChangeLogs,
  getLogType,
  type ChangeLogRecord,
  type LogType,
} from '../../auditLog/api/auditLogService'

const TABLE_LABELS: Record<string, string> = {
  cr7de_closingticketdetailses: 'Closing Ticket',
  cr7de_invoicedetailses: 'Invoice Detail',
  cr7de_newownerticketdetailses: 'New Owner Ticket',
  crc5c_unpaidchargeses: 'Unpaid Charge',
  crc5c_copyscheduledchargeses: 'Scheduled Charge',
  crc5c_manualchargeses: 'Manual Charge',
  crc5c_sellerledgers: 'Seller Ledger',
  crc5c_buyerledgers: 'Buyer Ledger',
}

const TYPE_OPTIONS: Array<{ value: '' | LogType; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'file', label: 'File Logs' },
  { value: 'status', label: 'Status Logs' },
  { value: 'override', label: 'Developer Override Logs' },
  { value: 'communication', label: 'Communication Logs' },
  { value: 'create', label: 'Create Logs' },
  { value: 'update', label: 'Update Logs' },
  { value: 'delete', label: 'Delete Logs' },
  { value: 'failure', label: 'Failure Logs' },
  { value: 'other', label: 'Other Logs' },
]

const TYPE_BADGE_CLASSES: Record<LogType, string> = {
  file: 'bg-indigo-100 text-indigo-700',
  status: 'bg-amber-100 text-amber-700',
  override: 'bg-purple-100 text-purple-700',
  communication: 'bg-sky-100 text-sky-700',
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  failure: 'bg-red-100 text-red-700',
  other: 'bg-slate-100 text-slate-700',
}

const TYPE_BADGE_LABELS: Record<LogType, string> = {
  file: 'file',
  status: 'status',
  override: 'override',
  communication: 'sent',
  create: 'create',
  update: 'update',
  delete: 'delete',
  failure: 'failed',
  other: 'action',
}

function formatTableLabel(tableName: string) {
  return TABLE_LABELS[tableName] ?? tableName
}

function formatTimestamp(value: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString()
}

function diffKeys(entry: ChangeLogRecord) {
  const keys = new Set([
    ...Object.keys(entry.oldData ?? {}),
    ...Object.keys(entry.newData ?? {}),
  ])
  return Array.from(keys)
}

function formatDiffValue(value: unknown) {
  if (value === undefined) return '—'
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

interface AppLogsViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * When set, the viewer locks to this ticket (opened from the Closing
   * Details page). When omitted, the ticket filter is a free-text field
   * so logs can be browsed across every ticket (opened from the dashboard).
   */
  ticketId?: string
}

export function AppLogsViewer({
  open,
  onOpenChange,
  ticketId,
}: AppLogsViewerProps) {
  // ticketId is fixed for the lifetime of a single AppLogsViewer mount
  // (the host page remounts when the ticket changes), so a plain initial
  // value is enough — no need to re-sync it via an effect.
  const [ticketFilter, setTicketFilter] = useState(
    ticketId ?? ''
  )
  const [tableFilter, setTableFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | LogType>('')
  const [logs, setLogs] = useState<ChangeLogRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(
    null
  )

  const loadLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const results = await getChangeLogs({
        ticketId: ticketFilter || undefined,
        tableName: tableFilter || undefined,
        type: typeFilter || undefined,
      })
      setLogs(results)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load app logs.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return

    let isMounted = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const results = await getChangeLogs({
          ticketId: ticketId || undefined,
        })
        if (isMounted) setLogs(results)
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load app logs.'
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [open, ticketId])

  const tableOptions = useMemo(
    () => Object.entries(TABLE_LABELS),
    []
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="invoice-viewer-sheet w-full sm:max-w-3xl">
        <SheetHeader className="invoice-viewer-sheet-header">
          <div>
            <SheetDescription className="text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
              Developer Mode
            </SheetDescription>
            <SheetTitle
              className="mt-1 text-xl font-semibold text-[#1E3A47]"
              style={{
                fontFamily:
                  "'Playfair Display', Georgia, serif",
                fontStyle: 'italic',
              }}
            >
              App Logs
              {ticketId ? ` — ${ticketId}` : ''}
            </SheetTitle>
          </div>
          <button
            type="button"
            className="invoice-viewer-close-btn"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </SheetHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-1 py-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-xs font-medium text-[#475569]">
              Ticket ID
              <input
                className="h-9 rounded-md border border-[#e2e8f0] px-2 text-sm"
                value={ticketFilter}
                disabled={Boolean(ticketId)}
                placeholder="All tickets"
                onChange={(e) =>
                  setTicketFilter(e.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-[#475569]">
              Table
              <select
                className="h-9 rounded-md border border-[#e2e8f0] px-2 text-sm"
                value={tableFilter}
                onChange={(e) =>
                  setTableFilter(e.target.value)
                }
              >
                <option value="">All tables</option>
                {tableOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-[#475569]">
              Type
              <select
                className="h-9 rounded-md border border-[#e2e8f0] px-2 text-sm"
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as '' | LogType)
                }
              >
                {TYPE_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#D5CBB8] bg-white px-3 text-xs font-semibold text-[#1E3A47] hover:bg-[#F5F2EC]"
              onClick={() => void loadLogs()}
              disabled={loading}
            >
              <RefreshCw
                className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>

          {error && <StatusBanner type="error" message={error} />}

          {!loading && !error && logs.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#e2e8f0] px-4 py-6 text-center text-sm text-[#64748b]">
              No log entries match these filters.
            </div>
          )}

          {logs.length > 0 && (
            <div className="flex flex-col divide-y divide-[#e2e8f0] rounded-lg border border-[#e2e8f0] text-sm">
              {logs.map((entry) => {
                const isExpanded = expandedId === entry.id
                const actionLabel =
                  entry.operation === 'action' &&
                  typeof entry.newData?.action === 'string'
                    ? entry.newData.action
                    : null
                const logType = getLogType(entry)
                const isFailure = logType === 'failure'
                return (
                  <div
                    key={entry.id}
                    className={isFailure ? 'bg-red-50/40' : undefined}
                  >
                    <button
                      type="button"
                      className="flex w-full flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-3 text-left text-sm hover:bg-[#f8fafc]"
                      onClick={() =>
                        setExpandedId(
                          isExpanded ? null : entry.id
                        )
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4 shrink-0 text-[#94a3b8]" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-[#94a3b8]" />
                      )}
                      <span className="w-40 shrink-0 text-xs text-[#64748b]">
                        {formatTimestamp(entry.createdOn)}
                      </span>
                      <span className="flex min-w-[160px] flex-1 items-center gap-1.5">
                        {logType === 'file' && (
                          <FileText
                            className="size-3.5 shrink-0 text-indigo-500"
                            aria-label="File log"
                          />
                        )}
                        <span
                          className={`truncate font-medium ${
                            isFailure ? 'text-red-700' : 'text-[#1E3A47]'
                          }`}
                        >
                          {actionLabel ?? formatTableLabel(entry.tableName)}
                        </span>
                      </span>
                      <span
                        className={`w-20 shrink-0 rounded-full px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wide ${TYPE_BADGE_CLASSES[logType]}`}
                      >
                        {TYPE_BADGE_LABELS[logType]}
                      </span>
                      {!ticketId && (
                        <span className="w-32 shrink-0 truncate text-xs text-[#64748b]">
                          {entry.ticketId}
                        </span>
                      )}
                      <span className="w-40 shrink-0 truncate text-xs text-[#94a3b8]">
                        {entry.modifiedBy}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="bg-[#f8fafc] px-9 py-4">
                        {diffKeys(entry).length === 0 ? (
                          <p className="text-xs text-[#94a3b8]">
                            No field-level data recorded.
                          </p>
                        ) : (
                          <table className="w-full border-separate border-spacing-y-1 text-xs">
                            <thead>
                              <tr className="text-left text-[#94a3b8]">
                                <th className="pb-2 pr-4 font-medium">
                                  Field
                                </th>
                                <th className="pb-2 pr-4 font-medium">
                                  Old
                                </th>
                                <th className="pb-2 font-medium">
                                  New
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {diffKeys(entry).map((key) => {
                                const hadOldValue =
                                  entry.oldData?.[key] !==
                                  undefined
                                const hasNewValue =
                                  entry.newData?.[key] !==
                                  undefined
                                const formattedOld =
                                  formatDiffValue(
                                    entry.oldData?.[key]
                                  )
                                const formattedNew =
                                  formatDiffValue(
                                    entry.newData?.[key]
                                  )
                                const isChanged =
                                  formattedOld !== formattedNew

                                return (
                                  <tr key={key}>
                                    <td className="py-1 pr-4 align-top font-mono text-[#475569]">
                                      {key}
                                    </td>
                                    <td
                                      className={`py-1 pr-4 align-top ${
                                        hadOldValue && isChanged
                                          ? 'rounded bg-red-50 px-2 py-1 text-red-700 line-through decoration-red-300'
                                          : hadOldValue
                                            ? 'text-[#64748b]'
                                            : 'text-[#94a3b8]'
                                      }`}
                                    >
                                      {formattedOld}
                                    </td>
                                    <td
                                      className={`py-1 align-top ${
                                        hasNewValue && isChanged
                                          ? 'rounded bg-emerald-50 px-2 py-1 text-emerald-700'
                                          : hasNewValue
                                            ? 'text-[#1E3A47]'
                                            : 'text-[#94a3b8]'
                                      }`}
                                    >
                                      {formattedNew}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
