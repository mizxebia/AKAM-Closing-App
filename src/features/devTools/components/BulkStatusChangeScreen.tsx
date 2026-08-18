import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { EmptyState } from '../../../components/enterprise'
import { ClosingTicketFilters } from '../../closingTickets/components/ClosingTicketFilters'
import { ClosingTicketTable } from '../../closingTickets/components/ClosingTicketTable'
import { closingTicketColumns } from '../../closingTickets/constants/closingTicketColumns'
import { useClosingTicketFilters } from '../../closingTickets/hooks/useClosingTicketFilters'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import { updateClosingTicket } from '../../closingTickets/api/closingTicketsService'
import { writeActionLog } from '../../auditLog/api/auditLogService'
import {
  TICKET_STATUS_OPTIONS,
  BOT_STATUS_OPTIONS,
  getTicketStatusLabel,
  getBotStatusLabel,
} from '../utils/statusOptions'

interface BulkStatusChangeScreenProps {
  records: ClosingTicketRecord[]
  userName: string | null
  userId: string | null
  onBack: () => void
  onApplied: () => Promise<void>
}

export function BulkStatusChangeScreen({
  records,
  userName,
  userId,
  onBack,
  onApplied,
}: BulkStatusChangeScreenProps) {
  const { filters, filteredRecords, setStatus, setSearch } =
    useClosingTicketFilters(records, { userName, userId })

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set()
  )
  const [ticketStatus, setTicketStatus] = useState(
    TICKET_STATUS_OPTIONS[0].value
  )
  const [botStatus, setBotStatus] = useState(
    BOT_STATUS_OPTIONS[0].value
  )
  const [applying, setApplying] = useState(false)
  const [summary, setSummary] = useState<{
    succeeded: number
    failed: string[]
  } | null>(null)

  const selectedRecords = records.filter((r) =>
    selectedIds.has(r.cr7de_closingticketdetailsid)
  )

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = (ids: string[]) => {
    setSelectedIds((current) => {
      const allSelected = ids.every((id) => current.has(id))
      const next = new Set(current)
      ids.forEach((id) =>
        allSelected ? next.delete(id) : next.add(id)
      )
      return next
    })
  }

  const applyToSelected = async () => {
    setApplying(true)
    setSummary(null)

    const results = await Promise.allSettled(
      selectedRecords.map(async (record) => {
        await updateClosingTicket(
          record.cr7de_closingticketdetailsid,
          {
            cr7de_ticketstatus:
              ticketStatus as ClosingTicketRecord['cr7de_ticketstatus'],
            cr109_botstatus:
              botStatus as ClosingTicketRecord['cr109_botstatus'],
          }
        )

        writeActionLog({
          ticketId:
            record.cr7de_ticketid ??
            record.cr7de_closingticketdetailsid,
          tableName: 'cr7de_closingticketdetailses',
          action: 'Developer Status Override (Bulk)',
          details: {
            to: {
              ticketStatus: getTicketStatusLabel(ticketStatus),
              botStatus: getBotStatusLabel(botStatus),
            },
          },
        })
      })
    )

    const failed = results
      .map((result, index) =>
        result.status === 'rejected'
          ? (selectedRecords[index].cr7de_ticketid ??
            selectedRecords[index].cr7de_closingticketdetailsid)
          : null
      )
      .filter((id): id is string => id !== null)

    setSummary({
      succeeded: results.length - failed.length,
      failed,
    })
    setApplying(false)
    setSelectedIds(new Set())
    await onApplied()
  }

  return (
    <motion.main
      className="mx-auto grid w-full max-w-[1500px] gap-2 px-4 py-5 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="font-semibold uppercase"
            style={{
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: '#b89a5a',
            }}
          >
            Developer Mode
          </p>
          <h1
            style={{
              fontFamily:
                "'Playfair Display', Georgia, serif",
              fontSize: '22px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#1E3A47',
            }}
          >
            Bulk Status Change
          </h1>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-sm font-semibold text-[#1E3A47] shadow-sm hover:bg-[#F5F2EC]"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
        <ShieldAlert className="size-3.5 shrink-0" />
        Select any number of tickets below, pick a target
        status, and apply. This bypasses the normal workflow and
        is recorded in the app logs for every ticket changed.
      </p>

      <div className="sticky top-0 z-10 flex flex-wrap items-end gap-3 rounded-xl border border-[#D5CBB8] bg-white px-4 py-3 shadow-sm">
        <span className="text-xs font-semibold text-[#1E3A47]">
          {selectedRecords.length} selected
        </span>

        <label className="flex flex-col gap-1 text-xs font-medium text-[#475569]">
          Ticket Status
          <select
            className="h-9 rounded-md border border-[#e2e8f0] px-2 text-sm"
            value={ticketStatus}
            onChange={(e) =>
              setTicketStatus(Number(e.target.value))
            }
          >
            {TICKET_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-[#475569]">
          Bot Status
          <select
            className="h-9 rounded-md border border-[#e2e8f0] px-2 text-sm"
            value={botStatus}
            onChange={(e) =>
              setBotStatus(Number(e.target.value))
            }
          >
            {BOT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="inline-flex h-9 items-center rounded-md border border-[#1E3A47] bg-[#1E3A47] px-3 text-xs font-semibold text-[#F5F2EC] hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={applying || selectedRecords.length === 0}
          onClick={() => void applyToSelected()}
        >
          {applying
            ? 'Applying…'
            : `Apply to ${selectedRecords.length} ticket${selectedRecords.length === 1 ? '' : 's'}`}
        </button>

        {selectedRecords.length > 0 && (
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-[#D5CBB8] bg-white px-3 text-xs font-semibold text-[#1E3A47] hover:bg-[#F5F2EC]"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </button>
        )}
      </div>

      {summary && (
        <StatusBanner
          type={summary.failed.length > 0 ? 'warning' : 'success'}
          message={
            summary.failed.length > 0
              ? `${summary.succeeded} updated, ${summary.failed.length} failed (${summary.failed.join(', ')}).`
              : `${summary.succeeded} ticket${summary.succeeded === 1 ? '' : 's'} updated successfully.`
          }
        />
      )}

      <ClosingTicketFilters
        filters={filters}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
      />

      {filteredRecords.length === 0 ? (
        <EmptyState
          title="No matching records"
          description="Adjust the status or search text to broaden the result set."
        />
      ) : (
        <ClosingTicketTable
          records={filteredRecords}
          columns={closingTicketColumns}
          onRecordSelect={toggleSelect}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      )}
    </motion.main>
  )
}
