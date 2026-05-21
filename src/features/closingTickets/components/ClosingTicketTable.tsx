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
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[#8B3A2A] underline underline-offset-2 transition hover:text-[#6e2d20]"
        >
          View all
          <ArrowUpRight className="size-3.5" />
        </button>
      }
      className="overflow-hidden"
    >
      <div className="-m-5 overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse">
          <thead className="sticky top-0 z-[1] bg-[#EDE8E0]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-[#D5CBB8] px-4 py-3 text-left font-semibold uppercase text-[#5F5E5A]"
                  style={{ fontSize: '11px', letterSpacing: '0.1em' }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedRecords.map((record, index) => (
              <motion.tr
                key={record.cr7de_closingticketdetailsid}
                className="cursor-pointer odd:bg-white even:bg-[#faf8f4] transition hover:bg-[#F5F2EC] focus:outline-none focus:ring-2 focus:ring-[#D5CBB8]"
                style={{ height: '44px' }}
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
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key}
                    className={`max-w-[220px] truncate px-4 py-2.5 text-sm text-[#4B5563] first:font-semibold first:text-[#1E3A47]${colIndex > 0 ? ' border-b border-[#EDE8E0]' : ''}`}
                  >
                    {column.key === 'cr7de_ticketstatus' ? (
                      <StatusBadge record={record} />
                    ) : (
                      formatClosingTicketValue(record, column.key)
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
