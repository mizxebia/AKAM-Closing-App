import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
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

const PAGE_SIZE = 10

type CreatedSortDirection = 'desc' | 'asc'

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
  const [page, setPage] = useState(0)
  const [createdSortDirection, setCreatedSortDirection] =
    useState<CreatedSortDirection>('desc')

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const firstCreated = a.createdon
        ? new Date(a.createdon).getTime()
        : 0
      const secondCreated = b.createdon
        ? new Date(b.createdon).getTime()
        : 0

      return createdSortDirection === 'desc'
        ? secondCreated - firstCreated
        : firstCreated - secondCreated
    })
  }, [records, createdSortDirection])

  useEffect(() => {
    setPage(0)
  }, [records, createdSortDirection])

  const toggleCreatedSort = () => {
    setCreatedSortDirection((currentDirection) =>
      currentDirection === 'desc' ? 'asc' : 'desc'
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
      description={`${records.length} records match the current view.`}
      actions={
        <button
          type="button"
          onClick={toggleCreatedSort}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] shadow-sm transition hover:border-[#1E3A47] hover:bg-[#F8F6F1] focus:outline-none focus:ring-2 focus:ring-[#D5CBB8]"
          aria-label={`Sort created date ${
            createdSortDirection === 'desc'
              ? 'oldest first'
              : 'newest first'
          }`}
        >
          {createdSortDirection === 'desc' ? (
            <ArrowDownWideNarrow className="size-4" />
          ) : (
            <ArrowUpWideNarrow className="size-4" />
          )}
          <span>
            {createdSortDirection === 'desc'
              ? 'Newest First'
              : 'Oldest First'}
          </span>
        </button>
      }
      className="overflow-hidden"
    >
      <div className="-m-3 overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse">
          <thead className="sticky top-0 z-[1] bg-[#EDE8E0]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-[#D5CBB8] px-4 py-2.5 text-left font-semibold uppercase text-[#5F5E5A]"
                  style={{ fontSize: '10px', letterSpacing: '0.1em' }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageRecords.map((record, index) => (
              <motion.tr
                key={record.cr7de_closingticketdetailsid}
                className="cursor-pointer odd:bg-white even:bg-[#faf8f4] transition hover:bg-[#F5F2EC] focus:outline-none focus:ring-2 focus:ring-[#D5CBB8]"
                style={{ height: '34px' }}
                onClick={() =>
                  onRecordSelect(
                    record.cr7de_closingticketdetailsid
                  )
                }
                tabIndex={0}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: Math.min(index * 0.015, 0.15),
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
                    className={`max-w-[220px] truncate px-4 py-1.5 text-xs text-[#4B5563] first:font-semibold first:text-[#1E3A47]${colIndex > 0 ? ' border-b border-[#EDE8E0]' : ''}`}
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
