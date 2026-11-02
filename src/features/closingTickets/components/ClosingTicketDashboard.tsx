import {
  Activity,
  CalendarDays,
  Files,
  ClipboardCheck,
  FileCheck2,
  CheckCircle2,
  Timer,
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

  // Aging = createdon -> modifiedon for tickets currently AT Completed —
  // not Sent to AR. A ticket that's already moved on to Sent to AR has a
  // modifiedon that reflects that later transition, not when it reached
  // Completed, so including it would count Sent-to-AR wait time as part
  // of "aging." Restricting to records still sitting at Completed is the
  // only way to exclude that time with the data available (no dedicated
  // per-status-transition timestamp exists).
  const completedWithDates = records.filter(
    (record) =>
      Number(record.cr7de_ticketstatus) === COMPLETED_STATUS &&
      record.createdon &&
      record.modifiedon
  )
  const avgAgingDays =
    completedWithDates.length > 0
      ? completedWithDates.reduce((sum, record) => {
          const created = new Date(record.createdon as string).getTime()
          const modified = new Date(record.modifiedon as string).getTime()
          return sum + (modified - created)
        }, 0) /
        completedWithDates.length /
        (1000 * 60 * 60 * 24)
      : 0

  return (
    <section
      className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7"
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
      <StatCard
        label="Avg. Aging"
        value={`${avgAgingDays.toFixed(1)}d`}
        description="Created → Completed"
        icon={Timer}
        tone="amber"
        trend={`${completedWithDates.length} completed`}
        accentColor="#8B5E3C"
      />
    </section>
  )
}
