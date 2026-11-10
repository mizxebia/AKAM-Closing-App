import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { EmptyState } from '../../../components/enterprise'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import { updateClosingTicket } from '../../closingTickets/api/closingTicketsService'
import { formatClosingTicketDate } from '../../closingTickets/utils/closingTicketFormatters'
import { computeChargeDate } from '../../newOwnerTickets/utils/chargeDate'
import {
  writeActionLog,
  logAppFailure,
} from '../../auditLog/api/auditLogService'

const TRANSFERRING_BUILDING_STATUS = 716070002

interface BulkChargeDateScreenProps {
  records: ClosingTicketRecord[]
  onBack: () => void
  onApplied: () => Promise<void>
}

function toDateInputValue(value?: string) {
  if (!value) {
    return ''
  }
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime())
    ? value.slice(0, 10)
    : parsedDate.toISOString().slice(0, 10)
}

export function BulkChargeDateScreen({
  records,
  onBack,
  onApplied,
}: BulkChargeDateScreenProps) {
  const { candidates, skippedNoClosingDate } = useMemo(() => {
    const transferring = records.filter(
      (record) =>
        Number(record.cr7de_ticketstatus) ===
          TRANSFERRING_BUILDING_STATUS && !record.cr109_chargedate
    )

    const withComputed: {
      record: ClosingTicketRecord
      closingDate: string
      chargeDate: string
    }[] = []
    let skipped = 0

    for (const record of transferring) {
      const closingDate = toDateInputValue(record.cr7de_closingdate)
      const chargeDate = closingDate
        ? computeChargeDate(closingDate)
        : ''
      if (!chargeDate) {
        skipped += 1
        continue
      }
      withComputed.push({ record, closingDate, chargeDate })
    }

    return { candidates: withComputed, skippedNoClosingDate: skipped }
  }, [records])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () =>
      new Set(
        candidates.map(
          ({ record }) => record.cr7de_closingticketdetailsid
        )
      )
  )
  const [applying, setApplying] = useState(false)
  const [summary, setSummary] = useState<{
    succeeded: number
    failed: string[]
  } | null>(null)

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

  const allSelected =
    candidates.length > 0 && selectedIds.size === candidates.length

  const toggleSelectAll = () => {
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(
            candidates.map(
              ({ record }) => record.cr7de_closingticketdetailsid
            )
          )
    )
  }

  const selectedCandidates = candidates.filter(({ record }) =>
    selectedIds.has(record.cr7de_closingticketdetailsid)
  )

  const applyToSelected = async () => {
    setApplying(true)
    setSummary(null)

    const results = await Promise.allSettled(
      selectedCandidates.map(async ({ record, chargeDate }) => {
        const recordTicketId =
          record.cr7de_ticketid ?? record.cr7de_closingticketdetailsid

        try {
          await updateClosingTicket(
            record.cr7de_closingticketdetailsid,
            { cr109_chargedate: chargeDate },
            record
          )

          writeActionLog({
            ticketId: recordTicketId,
            tableName: 'cr7de_closingticketdetailses',
            action: 'Bulk Charge Date Set',
            details: { to: { chargeDate } },
          })
        } catch (err) {
          logAppFailure({
            ticketId: recordTicketId,
            tableName: 'cr7de_closingticketdetailses',
            context: 'Bulk Charge Date Set',
            error: err,
          })
          throw err
        }
      })
    )

    const failed = results
      .map((result, index) =>
        result.status === 'rejected'
          ? (selectedCandidates[index].record.cr7de_ticketid ??
            selectedCandidates[index].record
              .cr7de_closingticketdetailsid)
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
            Admin Mode
          </p>
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: '22px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#1E3A47',
            }}
          >
            Bulk Set Charge Date
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
        Lists every Transferring Building ticket that doesn't already have
        a Charge Date, with the 1st-of-next-month value that would be set
        (same rule as the in-app Validate step). Deselect any you don't
        want, then apply. Recorded in the app logs for every ticket
        changed.
        {skippedNoClosingDate > 0 &&
          ` ${skippedNoClosingDate} ticket${
            skippedNoClosingDate === 1 ? '' : 's'
          } skipped — no Closing Date to compute from.`}
      </p>

      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-[#D5CBB8] bg-white px-4 py-3 shadow-sm">
        <span className="text-xs font-semibold text-[#1E3A47]">
          {selectedCandidates.length} of {candidates.length} selected
        </span>

        <button
          type="button"
          className="inline-flex h-9 items-center rounded-md border border-[#1E3A47] bg-[#1E3A47] px-3 text-xs font-semibold text-[#F5F2EC] hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={applying || selectedCandidates.length === 0}
          onClick={() => void applyToSelected()}
        >
          {applying
            ? 'Applying…'
            : `Apply to ${selectedCandidates.length} ticket${selectedCandidates.length === 1 ? '' : 's'}`}
        </button>

        {candidates.length > 0 && (
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-[#D5CBB8] bg-white px-3 text-xs font-semibold text-[#1E3A47] hover:bg-[#F5F2EC]"
            onClick={toggleSelectAll}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
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

      {candidates.length === 0 ? (
        <EmptyState
          title="Nothing to set"
          description="No Transferring Building ticket is missing a Charge Date right now."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2DAD0] bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2DAD0] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    className="size-3.5 accent-[#1E3A47]"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-2">Closing ID</th>
                <th className="px-3 py-2">Building</th>
                <th className="px-3 py-2">Closing Date</th>
                <th className="px-3 py-2">Charge Date (to set)</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map(({ record, chargeDate }) => {
                const id = record.cr7de_closingticketdetailsid
                return (
                  <tr
                    key={id}
                    className="border-b border-[#F1EFE8] last:border-0"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        className="size-3.5 accent-[#1E3A47]"
                        checked={selectedIds.has(id)}
                        onChange={() => toggleSelect(id)}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-[#1E3A47]">
                      {record.cr7de_ticketid ?? id}
                    </td>
                    <td className="px-3 py-2 text-[#475569]">
                      {record.cr7de_buildingname ?? '-'}
                    </td>
                    <td className="px-3 py-2 text-[#475569]">
                      {formatClosingTicketDate(record.cr7de_closingdate)}
                    </td>
                    <td className="px-3 py-2 font-medium text-[#1E3A47]">
                      {formatClosingTicketDate(chargeDate)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.main>
  )
}
