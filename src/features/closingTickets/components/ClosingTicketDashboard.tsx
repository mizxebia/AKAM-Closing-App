import { Activity, CalendarDays, Files, Timer, Building2 } from 'lucide-react'
import { StatCard } from '../../../components/enterprise'
import {
  useClosingPipelineDurations,
  type DurationStat,
} from '../hooks/useClosingPipelineDurations'
import type { ClosingTicketRecord } from '../types/closingTicket'

const COMPLETED_STATUS = 716070008
const SENT_TO_AR_STATUS = 396620001
const FAILED_TICKET_STATUS = 716070007
const INACTIVE_STATUSES = [
  COMPLETED_STATUS,
  SENT_TO_AR_STATUS,
  FAILED_TICKET_STATUS,
]

interface ClosingTicketDashboardProps {
  totalRecords: number
  records: ClosingTicketRecord[]
}

function formatDurationStat(
  stat: DurationStat,
  loading: boolean,
  noun: string
) {
  const value = loading
    ? '—'
    : stat.averageDays === null
      ? 'N/A'
      : `${stat.averageDays.toFixed(1)}d`

  const description = loading
    ? 'Calculating…'
    : stat.averageDays === null
      ? 'No logged transitions (30d)'
      : `From ${stat.sampleSize} ${noun}${stat.sampleSize === 1 ? '' : 's'} (30d)`

  return { value, description }
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

  const { timeToClose, yardiOwnerCreation, loading: loadingDurations } =
    useClosingPipelineDurations(records)

  const timeToCloseDisplay = formatDurationStat(
    timeToClose,
    loadingDurations,
    'closed ticket'
  )
  const yardiOwnerCreationDisplay = formatDurationStat(
    yardiOwnerCreation,
    loadingDurations,
    'ticket'
  )

  return (
    <section
      className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5"
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
        label="This Month"
        value={currentMonthRecords}
        description="Closings created"
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
        label="Avg. Time to Close"
        value={timeToCloseDisplay.value}
        description={timeToCloseDisplay.description}
        icon={Timer}
        tone="amber"
        trend="Created → Closed"
        accentColor="#B8860B"
      />
      <StatCard
        label="Yardi Owner Creation"
        value={yardiOwnerCreationDisplay.value}
        description={yardiOwnerCreationDisplay.description}
        icon={Building2}
        tone="amber"
        trend="Transfer → Completed"
        accentColor="#6B4423"
      />
    </section>
  )
}
