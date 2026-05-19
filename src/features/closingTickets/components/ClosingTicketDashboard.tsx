import { DashboardCard } from '../../../components/dashboard/DashboardCard'
import {
  ActivityIcon,
  CalendarIcon,
  FilesIcon,
} from '../../../components/icons/DashboardIcons'
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
    ['Processing', 'Post Closing', 'Validate'].includes(
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
      className="dashboard-grid"
      aria-label="Closing ticket summary"
    >
      <DashboardCard
        label="Total Closings"
        value={totalRecords}
        sub="All records"
        icon={FilesIcon}
        tint="blue"
      />
      <DashboardCard
        label="This Month"
        value={currentMonthRecords}
        sub="Closings"
        icon={CalendarIcon}
        tint="violet"
      />
      <DashboardCard
        label="Active Cases"
        value={activeRecords}
        sub="In progress"
        icon={ActivityIcon}
        tint="emerald"
      />
    </section>
  )
}
