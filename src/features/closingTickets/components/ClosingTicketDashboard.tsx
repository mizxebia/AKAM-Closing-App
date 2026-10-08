import {
  Activity,
  CalendarDays,
  Files,
  ClipboardCheck,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react'
import { StatCard } from '../../../components/enterprise'
import type { ClosingTicketRecord } from '../types/closingTicket'

const COMPLETED_STATUS = 716070008
const SENT_TO_AR_STATUS = 396620001
const FAILED_TICKET_STATUS = 716070007
const VALIDATE_CLOSINGS_STATUS = 716070001
const READY_FOR_POST_CLOSING_STATUS = 716070006
const INACTIVE_STATUSES = [
  COMPLETED_STATUS,
  SENT_TO_AR_STATUS,
  FAILED_TICKET_STATUS,
]

interface ClosingTicketDashboardProps {
  totalRecords: number
  records: ClosingTicketRecord[]
}

export function ClosingTicketDashboard({
  totalRecords,
  records,
}: ClosingTicketDashboardProps) {
  // "Active" = every status except the three terminal ones — Completed,
  // Sent to AR, and Failed — rather than an allowlist of specific
  // in-progress statuses, so it doesn't silently miss new/renamed ones.
  const activeRecords = records.filter(
    (record) =>
      !INACTIVE_STATUSES.includes(Number(record.cr7de_ticketstatus))
  ).length

  const closingsDoneRecords = records.filter((record) => {
    const status = Number(record.cr7de_ticketstatus)
    return status === SENT_TO_AR_STATUS || status === COMPLETED_STATUS
  }).length

  const currentMonthRecords = records.filter(
    (record) => {
      if (!record.createdon) {
        return false
      }

      const createdDate = new Date(record.createdon)
      const currentDate = new Date()

      return (
        createdDate.getMonth() ===
          currentDate.getMonth() &&
        createdDate.getFullYear() ===
          currentDate.getFullYear()
      )
    }
  ).length

  const validationPendingRecords = records.filter(
    (record) =>
      Number(record.cr7de_ticketstatus) === VALIDATE_CLOSINGS_STATUS
  ).length

  const readyForPostClosingRecords = records.filter(
    (record) =>
      Number(record.cr7de_ticketstatus) === READY_FOR_POST_CLOSING_STATUS
  ).length

  return (
    <section
      className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6"
      aria-label="Closing ticket summary"
    >
      <StatCard
        label="Total Closings"
        value={totalRecords}
        description="All records"
        icon={Files}
        tone="blue"
        trend="Portfolio wide"
        accentColor="#1E3A47"
      />
      <StatCard
        label="Closings Done"
        value={closingsDoneRecords}
        description="AR + Completed"
        icon={CheckCircle2}
        tone="emerald"
        trend="Closed out"
        accentColor="#1a7a52"
      />
      <StatCard
        label="This Month"
        value={currentMonthRecords}
        description="New closings"
        icon={CalendarDays}
        tone="violet"
        trend="Current period"
        accentColor="#C9A96E"
      />
      <StatCard
        label="Active Cases"
        value={activeRecords}
        description="In progress"
        icon={Activity}
        tone="emerald"
        trend="Needs attention"
        accentColor="#8B3A2A"
      />
      <StatCard
        label="Validation Pending"
        value={validationPendingRecords}
        description="Awaiting Validate"
        icon={ClipboardCheck}
        tone="violet"
        trend="Needs review"
        accentColor="#6B4423"
      />
      <StatCard
        label="Ready for Post Closing"
        value={readyForPostClosingRecords}
        description="Awaiting RPTT upload"
        icon={FileCheck2}
        tone="blue"
        trend="Next step"
        accentColor="#2A5C8B"
      />
    </section>
  )
}
