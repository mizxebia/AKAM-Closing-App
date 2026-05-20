import { useMemo } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  SectionCard,
  StatusBadge as EnterpriseStatusBadge,
} from '../../../components/enterprise'
import type {
  ClosingTicketColumn,
  ClosingTicketRecord,
} from '../types/closingTicket'
import {
  formatClosingTicketValue,
  getClosingTicketStatusDisplay,
} from '../utils/closingTicketFormatters'

interface ClosingTicketTableProps {
  records: ClosingTicketRecord[]
  columns: ClosingTicketColumn[]
  onRecordSelect: (recordId: string) => void
}

export function ClosingTicketTable({
  records,
  columns,
  onRecordSelect,
}: ClosingTicketTableProps) {
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const firstCreated = a.createdon
        ? new Date(a.createdon).getTime()
        : 0
      const secondCreated = b.createdon
        ? new Date(b.createdon).getTime()
        : 0

      return firstCreated - secondCreated
    })
  }, [records])

  return (
    <SectionCard
      title="Recent Closings"
      description={`${records.length} records match the current view.`}
      actions={
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          View all
          <ArrowUpRight className="size-3.5" />
        </button>
      }
      className="overflow-hidden"
    >
      <div className="-m-5 overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse">
        <thead className="sticky top-0 z-[1] bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedRecords.map((record, index) => (
            <motion.tr
              key={
                record.cr7de_closingticketdetailsid
              }
              className="cursor-pointer border-b border-slate-100 odd:bg-white even:bg-slate-50/50 transition hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
              onClick={() =>
                onRecordSelect(
                  record.cr7de_closingticketdetailsid
                )
              }
              tabIndex={0}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: Math.min(index * 0.015, 0.2),
              }}
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
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="max-w-[220px] truncate px-4 py-3 text-sm text-slate-600 first:font-semibold first:text-slate-950"
                >
                  {column.key ===
                  'cr7de_ticketstatus' ? (
                    <StatusBadge record={record} />
                  ) : (
                    formatClosingTicketValue(
                      record,
                      column.key
                    )
                  )}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
      </div>
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
