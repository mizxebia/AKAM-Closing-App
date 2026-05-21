import { Activity, CalendarDays, Files } from 'lucide-react'
import { StatCard } from '../../../components/enterprise'
import { formatClosingTicketStatus } from '../utils/closingTicketFormatters'
import type { ClosingTicketRecord } from '../types/closingTicket'

interface ClosingTicketDashboardProps {
  totalRecords: number
  records: ClosingTicketRecord[]
}

export function ClosingTicketDashboard({
  totalRecords,
  records,
}: ClosingTicketDashboardProps) {
  const activeRecords = records.filter((record) =>
    ['Processing', 'Post Closing', 'Validated'].includes(
      formatClosingTicketStatus(record.cr7de_ticketstatus)
    )
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

  return (
    <section
      className="grid gap-4 md:grid-cols-3"
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
    </section>
  )
}
