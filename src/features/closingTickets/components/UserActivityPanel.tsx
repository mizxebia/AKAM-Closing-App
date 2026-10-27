import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bot,
  Gauge,
  ListChecks,
  PieChart as PieChartIcon,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Avatar, getColorForName } from '../../../components/enterprise'
import { getClosingTicketStatusDisplay } from '../utils/closingTicketFormatters'
import { getFailureReason } from '../utils/closingTicketFailureReasons'
import {
  Cr7de_closingticketdetailsescr109_botstatus,
  Cr7de_closingticketdetailsescr7de_ticketstatus,
} from '../../../generated/models/Cr7de_closingticketdetailsesModel'
import type { ClosingTicketRecord } from '../types/closingTicket'

// Sent to AR — excluded from the "active workload" views in this panel
// since those closings have already moved on from the agent's desk.
const SENT_TO_AR_STATUS = 396620001
const COMPLETED_STATUS = 716070008
const FAILED_STATUS = 716070007

// Beyond this many distinct agents, the smallest slices/bars are grouped
// into a single "Other" entry so the chart stays readable.
const MAX_CHART_ENTRIES = 7

const MAX_NEEDS_ATTENTION = 6

interface AgentActivity {
  name: string
  count: number
}

interface StatusBreakdownEntry {
  status: number
  count: number
  label: string
  tone: ReturnType<typeof getClosingTicketStatusDisplay>['tone']
}

interface FailedTicketEntry {
  id: string
  ticketId: string
  agent: string
  reason: string
}

function buildAgentActivity(
  records: ClosingTicketRecord[],
  statusesToExclude: number[]
): AgentActivity[] {
  const counts = new Map<string, number>()

  for (const record of records) {
    if (
      statusesToExclude.includes(Number(record.cr7de_ticketstatus))
    ) {
      continue
    }
    const agent = record.cr7de_closingagentname?.trim() || 'Unassigned'
    counts.set(agent, (counts.get(agent) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function capEntries(agents: AgentActivity[]) {
  if (agents.length <= MAX_CHART_ENTRIES) return agents

  const top = agents.slice(0, MAX_CHART_ENTRIES - 1)
  const rest = agents.slice(MAX_CHART_ENTRIES - 1)
  const otherCount = rest.reduce((sum, a) => sum + a.count, 0)

  return [...top, { name: 'Other', count: otherCount }]
}

function buildStatusBreakdown(
  records: ClosingTicketRecord[],
  statusesToExclude: number[]
): StatusBreakdownEntry[] {
  const counts = new Map<number, number>()

  for (const record of records) {
    const status = Number(record.cr7de_ticketstatus)
    if (statusesToExclude.includes(status)) continue
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([status, count]) => {
      const display = getClosingTicketStatusDisplay(
        status as ClosingTicketRecord['cr7de_ticketstatus']
      )
      return { status, count, label: display.label, tone: display.tone }
    })
    .sort((a, b) => b.count - a.count)
}

function buildAllStatusCounts(records: ClosingTicketRecord[]) {
  const counts = new Map<number, number>()
  for (const record of records) {
    const status = Number(record.cr7de_ticketstatus)
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  return Object.entries(
    Cr7de_closingticketdetailsescr7de_ticketstatus
  ).map(([value, label]) => ({
    name: label,
    count: counts.get(Number(value)) ?? 0,
  }))
}

function buildFailedTickets(
  records: ClosingTicketRecord[]
): FailedTicketEntry[] {
  return records
    .filter(
      (record) => Number(record.cr7de_ticketstatus) === FAILED_STATUS
    )
    .map((record) => ({
      id: record.cr7de_closingticketdetailsid,
      ticketId:
        record.cr7de_ticketid ?? record.cr7de_closingticketdetailsid,
      agent: record.cr7de_closingagentname?.trim() || 'Unassigned',
      reason: getFailureReason(record) ?? 'An unexpected error occurred.',
    }))
    .slice(0, MAX_NEEDS_ATTENTION)
}

function buildPerformanceStats(records: ClosingTicketRecord[]) {
  const total = records.length
  const completed = records.filter(
    (r) => Number(r.cr7de_ticketstatus) === COMPLETED_STATUS
  ).length
  const failed = records.filter(
    (r) => Number(r.cr7de_ticketstatus) === FAILED_STATUS
  ).length

  const completionRate = total > 0 ? (completed / total) * 100 : 0
  const failureRate = total > 0 ? (failed / total) * 100 : 0

  const completedWithDates = records.filter(
    (r) =>
      Number(r.cr7de_ticketstatus) === COMPLETED_STATUS &&
      r.createdon &&
      r.modifiedon
  )
  const avgTurnaroundDays =
    completedWithDates.length > 0
      ? completedWithDates.reduce((sum, r) => {
          const created = new Date(r.createdon as string).getTime()
          const modified = new Date(r.modifiedon as string).getTime()
          return sum + (modified - created)
        }, 0) /
        completedWithDates.length /
        (1000 * 60 * 60 * 24)
      : 0

  const withBotStatus = records.filter(
    (r) =>
      r.cr109_botstatus !== undefined &&
      String(r.cr109_botstatus).trim() !== ''
  )
  const botFailures = withBotStatus.filter((r) => {
    const label =
      Cr7de_closingticketdetailsescr109_botstatus[
        Number(
          r.cr109_botstatus
        ) as keyof typeof Cr7de_closingticketdetailsescr109_botstatus
      ]
    return label?.startsWith('Failed')
  }).length
  const automationSuccessRate =
    withBotStatus.length > 0
      ? ((withBotStatus.length - botFailures) / withBotStatus.length) *
        100
      : 0

  return {
    total,
    completed,
    failed,
    completionRate,
    failureRate,
    avgTurnaroundDays,
    automationSuccessRate,
    botFailures,
    withBotStatusCount: withBotStatus.length,
  }
}

interface UserActivityPanelProps {
  records: ClosingTicketRecord[]
  onBack: () => void
}

export function UserActivityPanel({
  records,
  onBack,
}: UserActivityPanelProps) {
  const agents = useMemo(
    () => buildAgentActivity(records, [SENT_TO_AR_STATUS]),
    [records]
  )
  const pieData = useMemo(() => capEntries(agents), [agents])
  const statusBreakdown = useMemo(
    () => buildStatusBreakdown(records, [SENT_TO_AR_STATUS]),
    [records]
  )
  const pendingActions = useMemo(
    () =>
      capEntries(
        buildAgentActivity(records, [
          SENT_TO_AR_STATUS,
          COMPLETED_STATUS,
        ])
      ),
    [records]
  )
  const failedTickets = useMemo(
    () => buildFailedTickets(records),
    [records]
  )
  const allStatusCounts = useMemo(
    () => buildAllStatusCounts(records),
    [records]
  )
  const performance = useMemo(
    () => buildPerformanceStats(records),
    [records]
  )

  const totalActive = agents.reduce((sum, a) => sum + a.count, 0)
  const topAgent = agents[0]
  const totalPending = pendingActions.reduce((sum, a) => sum + a.count, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mx-auto grid w-full max-w-[1500px] gap-4 px-4 py-4 sm:px-6 lg:px-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#4B5563] transition hover:text-[#1E3A47]"
          >
            <ArrowLeft className="size-3.5" />
            Back to Dashboard
          </button>
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
            User Activity
          </h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatTile
          label="Active Closings"
          value={totalActive}
          description="Excludes Sent to AR"
        />
        <StatTile
          label="Closing Agents"
          value={agents.length}
          description="With at least one active closing"
        />
        <StatTile
          label="Top Agent"
          value={topAgent?.count ?? 0}
          description={topAgent?.name ?? 'No active closings'}
        />
        <StatTile
          label="Needs Attention"
          value={failedTickets.length}
          description="Failed closings"
          accent={failedTickets.length > 0 ? '#b91c1c' : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm lg:col-span-3">
          <div className="mb-3 flex items-center gap-2">
            <PieChartIcon className="size-4 text-[#1E3A47]" />
            <h2 className="text-sm font-semibold text-[#1E3A47]">
              Closings by Agent
            </h2>
          </div>

          {agents.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#8a8578]">
              No active closings to chart yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={2}
                      cornerRadius={6}
                      stroke="#F5F2EC"
                      strokeWidth={2}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === 'Other'
                              ? '#B4B2A9'
                              : getColorForName(entry.name)
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${value} closing${value === 1 ? '' : 's'}`,
                        String(name),
                      ]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #D5CBB8',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="flex flex-col gap-2">
                {pieData.map((entry) => (
                  <li
                    key={entry.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {entry.name === 'Other' ? (
                        <span
                          className="inline-block size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: '#B4B2A9' }}
                        />
                      ) : (
                        <Avatar name={entry.name} size="xs" />
                      )}
                      <span className="truncate text-xs font-medium text-[#1E3A47]">
                        {entry.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[#4B5563]">
                      {entry.count}
                      <span className="ml-1 text-[#9b9890]">
                        (
                        {totalActive > 0
                          ? Math.round(
                              (entry.count / totalActive) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4 text-[#1E3A47]" />
            <h2 className="text-sm font-semibold text-[#1E3A47]">
              Status Breakdown
            </h2>
          </div>

          {statusBreakdown.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#8a8578]">
              No active closings yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {statusBreakdown.map((entry) => {
                const max = statusBreakdown[0].count || 1
                const widthPct = Math.max(
                  6,
                  Math.round((entry.count / max) * 100)
                )
                return (
                  <li key={entry.status} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#1E3A47]">
                        {entry.label}
                      </span>
                      <span className="font-semibold text-[#4B5563]">
                        {entry.count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F1EFE8]">
                      <div
                        className="h-full rounded-full bg-[#1E3A47]"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm lg:col-span-3">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="size-4 text-[#1E3A47]" />
            <h2 className="text-sm font-semibold text-[#1E3A47]">
              Pending Actions by Agent
            </h2>
            <span className="text-xs text-[#9b9890]">
              (not yet Completed or Sent to AR)
            </span>
          </div>

          {pendingActions.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#8a8578]">
              Nothing pending right now.
            </p>
          ) : (
            <div style={{ width: '100%', height: Math.max(160, pendingActions.length * 32) }}>
              <ResponsiveContainer>
                <BarChart
                  data={pendingActions}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="#EDE8E0"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#8a8578' }}
                    axisLine={{ stroke: '#D5CBB8' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: '#1E3A47' }}
                    axisLine={{ stroke: '#D5CBB8' }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${value} pending`,
                      'Actions',
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #D5CBB8',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {pendingActions.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.name === 'Other'
                            ? '#B4B2A9'
                            : getColorForName(entry.name)
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {pendingActions.length > 0 && (
            <p className="mt-2 text-xs text-[#9b9890]">
              {totalPending} total pending action
              {totalPending === 1 ? '' : 's'} across {pendingActions.length}{' '}
              agent{pendingActions.length === 1 ? '' : 's'}.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="size-4 text-[#b91c1c]" />
            <h2 className="text-sm font-semibold text-[#1E3A47]">
              Needs Attention
            </h2>
          </div>

          {failedTickets.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#8a8578]">
              No failed closings right now.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {failedTickets.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-[#fecaca] bg-[#FEF2F2] px-2.5 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Avatar name={entry.agent} size="xs" />
                      <span className="truncate text-xs font-semibold text-[#1E3A47]">
                        {entry.ticketId}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#b91c1c]">
                      Failed
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-[#8a5a5a]" title={entry.reason}>
                    {entry.reason}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Gauge className="size-4 text-[#1E3A47]" />
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: '17px',
            fontWeight: 700,
            color: '#1E3A47',
          }}
        >
          App Performance
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatTile
          label="Total Closings"
          value={performance.total}
          description="All-time, every status"
        />
        <StatTile
          label="Completed"
          value={performance.completed}
          description={`${performance.completionRate.toFixed(0)}% completion rate`}
        />
        <StatTile
          label="Avg. Turnaround"
          value={`${performance.avgTurnaroundDays.toFixed(1)}d`}
          description="Created → Completed"
        />
        <StatTile
          label="Automation Success"
          value={`${performance.automationSuccessRate.toFixed(0)}%`}
          description={`${performance.withBotStatusCount} tracked by bot`}
        />
        <StatTile
          label="Failure Rate"
          value={`${performance.failureRate.toFixed(0)}%`}
          description={`${performance.failed} failed closings`}
          accent={performance.failed > 0 ? '#b91c1c' : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm lg:col-span-3">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="size-4 text-[#1E3A47]" />
            <h2 className="text-sm font-semibold text-[#1E3A47]">
              All-Time Status Distribution
            </h2>
          </div>

          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart
                data={allStatusCounts}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="#EDE8E0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#8a8578' }}
                  axisLine={{ stroke: '#D5CBB8' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#8a8578' }}
                  axisLine={{ stroke: '#D5CBB8' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #D5CBB8',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#1E3A47" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Bot className="size-4 text-[#1E3A47]" />
            <h2 className="text-sm font-semibold text-[#1E3A47]">
              Automation Efficiency
            </h2>
          </div>

          {performance.withBotStatusCount === 0 ? (
            <p className="py-10 text-center text-xs text-[#8a8578]">
              No bot-tracked closings yet.
            </p>
          ) : (
            <>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'Automated OK',
                          value:
                            performance.withBotStatusCount -
                            performance.botFailures,
                        },
                        {
                          name: 'Automation Failures',
                          value: performance.botFailures,
                        },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={2}
                      cornerRadius={6}
                      stroke="#F5F2EC"
                      strokeWidth={2}
                    >
                      <Cell fill="#0F6E56" />
                      <Cell fill="#b91c1c" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #D5CBB8',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: '#0F6E56' }}
                  />
                  Automated OK
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: '#b91c1c' }}
                  />
                  Failures ({performance.botFailures})
                </span>
              </div>
            </>
          )}
        </section>
      </div>
    </motion.div>
  )
}

function StatTile({
  label,
  value,
  description,
  accent,
}: {
  label: string
  value: number | string
  description: string
  accent?: string
}) {
  return (
    <div
      className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm"
      style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-semibold text-[#1E3A47]"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs text-[#8a8578]">
        {description}
      </p>
    </div>
  )
}
