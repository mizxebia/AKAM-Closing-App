import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Clock,
  Gauge,
  ListChecks,
  PieChart as PieChartIcon,
  Send,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Avatar, getColorForName } from '../../../components/enterprise'
import { getClosingTicketStatusDisplay } from '../utils/closingTicketFormatters'
import { getFailureReason } from '../utils/closingTicketFailureReasons'
import { Cr7de_closingticketdetailsescr7de_ticketstatus } from '../../../generated/models/Cr7de_closingticketdetailsesModel'
import type { ClosingTicketRecord } from '../types/closingTicket'

// Sent to AR — excluded from the "active workload" views in this panel
// since those closings have already moved on from the agent's desk.
const SENT_TO_AR_STATUS = 396620001
const COMPLETED_STATUS = 716070008
const FAILED_STATUS = 716070007
const READY_FOR_POST_CLOSING_STATUS = 716070006
const VALIDATE_CLOSINGS_STATUS = 716070001

const WAITING_ON_USER_BUCKETS = [
  { key: 'readyForPostClosing', label: 'Ready for Post Closing' },
  { key: 'validateClosings', label: 'Validate Closings' },
  { key: 'awaitingAR', label: 'Completed, Awaiting AR' },
] as const

// Beyond this many distinct agents, the smallest slices/bars are grouped
// into a single "Other" entry so the chart stays readable.
const MAX_CHART_ENTRIES = 7

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #D5CBB8',
  fontSize: '12px',
}

function daysSince(dateString?: string): number | null {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  )
}

type PageRange = 'thisMonth' | 'last3' | 'last6' | 'allTime'

const PAGE_RANGE_OPTIONS: { value: PageRange; label: string }[] = [
  { value: 'thisMonth', label: 'This Month' },
  { value: 'last3', label: 'Last 3 Months' },
  { value: 'last6', label: 'Last 6 Months' },
  { value: 'allTime', label: 'All Time' },
]

function pageRangeBounds(range: PageRange): { from: Date | null } {
  if (range === 'allTime') return { from: null }
  const now = new Date()
  if (range === 'thisMonth') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1) }
  }
  const monthsBack = range === 'last3' ? 2 : 5
  return {
    from: new Date(now.getFullYear(), now.getMonth() - monthsBack, 1),
  }
}

/** Filters by createdon falling within [from, to] (inclusive). Either
 * bound may be omitted/null to leave that side open. */
function filterByCreatedRange(
  records: ClosingTicketRecord[],
  from: Date | null,
  to: Date | null
) {
  if (!from && !to) return records
  return records.filter((record) => {
    if (!record.createdon) return false
    const created = new Date(record.createdon).getTime()
    if (Number.isNaN(created)) return false
    if (from && created < from.getTime()) return false
    if (to && created > to.getTime()) return false
    return true
  })
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

// A Completed closing that will never go to AR (sendtoar = false) is fully
// done — it shouldn't count toward anyone's active workload anymore.
function isFullyDone(record: ClosingTicketRecord) {
  return (
    Number(record.cr7de_ticketstatus) === COMPLETED_STATUS &&
    !record.cr109_sendtoar
  )
}

function isActiveRecord(record: ClosingTicketRecord) {
  const status = Number(record.cr7de_ticketstatus)
  if (status === SENT_TO_AR_STATUS) return false
  if (isFullyDone(record)) return false
  return true
}

function waitingOnUserBucket(
  record: ClosingTicketRecord
): (typeof WAITING_ON_USER_BUCKETS)[number]['key'] | null {
  const status = Number(record.cr7de_ticketstatus)
  if (status === READY_FOR_POST_CLOSING_STATUS) return 'readyForPostClosing'
  if (status === VALIDATE_CLOSINGS_STATUS) return 'validateClosings'
  if (status === COMPLETED_STATUS && Boolean(record.cr109_sendtoar)) {
    return 'awaitingAR'
  }
  return null
}

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

interface QueueEntry {
  id: string
  ticketId: string
  agent: string
  ageDays: number
  detail: string
}

function buildAgentActivity(
  records: ClosingTicketRecord[],
  predicate: (record: ClosingTicketRecord) => boolean
): AgentActivity[] {
  const counts = new Map<string, number>()

  for (const record of records) {
    if (!predicate(record)) continue
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
  records: ClosingTicketRecord[]
): StatusBreakdownEntry[] {
  const counts = new Map<number, number>()

  for (const record of records) {
    if (!isActiveRecord(record)) continue
    const status = Number(record.cr7de_ticketstatus)
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

function buildQueue(
  records: ClosingTicketRecord[],
  predicate: (record: ClosingTicketRecord) => boolean,
  detailFor: (record: ClosingTicketRecord) => string
): QueueEntry[] {
  return records
    .filter(predicate)
    .map((record) => ({
      id: record.cr7de_closingticketdetailsid,
      ticketId:
        record.cr7de_ticketid ?? record.cr7de_closingticketdetailsid,
      agent: record.cr7de_closingagentname?.trim() || 'Unassigned',
      ageDays: daysSince(record.modifiedon) ?? 0,
      detail: detailFor(record),
    }))
    .sort((a, b) => b.ageDays - a.ageDays)
}

function buildWaitingOnUserByStatus(records: ClosingTicketRecord[]) {
  const counts = new Map<string, number>()
  for (const record of records) {
    const bucket = waitingOnUserBucket(record)
    if (!bucket) continue
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }
  return WAITING_ON_USER_BUCKETS.map((bucket) => ({
    name: bucket.label,
    count: counts.get(bucket.key) ?? 0,
  }))
}

function buildMonthlyTrend(records: ClosingTicketRecord[], monthsBack = 6) {
  const now = new Date()
  const monthKeys: string[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    )
  }

  const toKey = (value: string) => {
    const d = new Date(value)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  const toLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: 'short',
      year: '2-digit',
    })
  }

  const created = new Map<string, number>()
  const completed = new Map<string, number>()

  for (const record of records) {
    if (record.createdon) {
      const key = toKey(record.createdon)
      created.set(key, (created.get(key) ?? 0) + 1)
    }
    const status = Number(record.cr7de_ticketstatus)
    if (
      (status === COMPLETED_STATUS || status === SENT_TO_AR_STATUS) &&
      record.modifiedon
    ) {
      const key = toKey(record.modifiedon)
      completed.set(key, (completed.get(key) ?? 0) + 1)
    }
  }

  return monthKeys.map((key) => ({
    month: toLabel(key),
    Created: created.get(key) ?? 0,
    Completed: completed.get(key) ?? 0,
  }))
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

  return { total, completed, failed, completionRate, failureRate, avgTurnaroundDays }
}

interface ActiveSectorProps {
  cx?: number
  cy?: number
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  fill?: string
}

function renderActiveSlice(props: ActiveSectorProps) {
  return (
    <Sector
      cx={props.cx}
      cy={props.cy}
      innerRadius={props.innerRadius}
      outerRadius={(props.outerRadius ?? 0) + 8}
      startAngle={props.startAngle}
      endAngle={props.endAngle}
      fill={props.fill}
    />
  )
}

/** Bar fill/opacity that "pops" the hovered bar instead of relying on
 * recharts' default gray cursor highlight band (removed via cursor={false}
 * on every Tooltip in this panel). */
function useBarHover() {
  const [hovered, setHovered] = useState<number | null>(null)
  return {
    hovered,
    onMouseEnter: (_: unknown, index: number) => setHovered(index),
    onMouseLeave: () => setHovered(null),
    opacityFor: (index: number) =>
      hovered === null || hovered === index ? 1 : 0.55,
  }
}

interface UserActivityPanelProps {
  records: ClosingTicketRecord[]
  onBack: () => void
  onSelectTicket: (recordId: string) => void
}

export function UserActivityPanel({
  records,
  onBack,
  onSelectTicket,
}: UserActivityPanelProps) {
  const [pageRange, setPageRange] = useState<PageRange>('allTime')
  const scopedRecords = useMemo(() => {
    const { from } = pageRangeBounds(pageRange)
    return filterByCreatedRange(records, from, null)
  }, [records, pageRange])
  const pageRangeLabel =
    PAGE_RANGE_OPTIONS.find((o) => o.value === pageRange)?.label ??
    'All Time'

  const agents = useMemo(
    () => buildAgentActivity(scopedRecords, isActiveRecord),
    [scopedRecords]
  )
  const pieData = useMemo(() => capEntries(agents), [agents])
  const statusBreakdown = useMemo(
    () => buildStatusBreakdown(scopedRecords),
    [scopedRecords]
  )
  const pendingActions = useMemo(
    () =>
      capEntries(
        buildAgentActivity(scopedRecords, (r) => {
          const status = Number(r.cr7de_ticketstatus)
          return status !== SENT_TO_AR_STATUS && status !== COMPLETED_STATUS
        })
      ),
    [scopedRecords]
  )
  const failedQueue = useMemo(
    () =>
      buildQueue(
        scopedRecords,
        (r) => Number(r.cr7de_ticketstatus) === FAILED_STATUS,
        (r) => getFailureReason(r) ?? 'An unexpected error occurred.'
      ),
    [scopedRecords]
  )
  const waitingOnUserByStatus = useMemo(
    () => buildWaitingOnUserByStatus(scopedRecords),
    [scopedRecords]
  )
  const waitingOnUserByAgent = useMemo(
    () =>
      capEntries(
        buildAgentActivity(
          scopedRecords,
          (r) => waitingOnUserBucket(r) !== null
        )
      ),
    [scopedRecords]
  )
  const totalWaitingOnUser = waitingOnUserByStatus.reduce(
    (sum, entry) => sum + entry.count,
    0
  )
  const [waitingView, setWaitingView] = useState<'status' | 'user'>(
    'status'
  )

  // All-Time Status Distribution has its own slicer, bounded from the
  // earliest Completed closing (across every record, not just the page's
  // current range) through today — independent of the page-level filter
  // above so it can always answer "show me the full history."
  const firstCompletedDate = useMemo(() => {
    const dates = records
      .filter((r) => Number(r.cr7de_ticketstatus) === COMPLETED_STATUS)
      .map((r) => r.createdon)
      .filter((d): d is string => Boolean(d))
    if (dates.length === 0) return null
    return dates.reduce((min, d) => (d < min ? d : min), dates[0])
  }, [records])
  const today = useMemo(() => toDateInputValue(new Date()), [])
  const [statusRangeFrom, setStatusRangeFrom] = useState('')
  const [statusRangeTo, setStatusRangeTo] = useState('')
  const statusRangeRecords = useMemo(() => {
    if (!statusRangeFrom && !statusRangeTo) return scopedRecords
    return filterByCreatedRange(
      records,
      statusRangeFrom ? new Date(statusRangeFrom) : null,
      statusRangeTo ? new Date(`${statusRangeTo}T23:59:59`) : null
    )
  }, [records, scopedRecords, statusRangeFrom, statusRangeTo])
  const allStatusCounts = useMemo(
    () => buildAllStatusCounts(statusRangeRecords),
    [statusRangeRecords]
  )

  const trendData = useMemo(
    () => buildMonthlyTrend(scopedRecords),
    [scopedRecords]
  )
  const performance = useMemo(
    () => buildPerformanceStats(scopedRecords),
    [scopedRecords]
  )

  const pendingBarHover = useBarHover()
  const statusBarHover = useBarHover()
  const waitingBarHover = useBarHover()

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

        <div className="flex shrink-0 rounded-md border border-[#D5CBB8] p-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]">
          {PAGE_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPageRange(option.value)}
              className={`rounded px-2.5 py-1.5 transition ${
                pageRange === option.value
                  ? 'bg-[#1E3A47] text-[#F5F2EC]'
                  : 'text-[#5F5E5A] hover:text-[#1E3A47]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatTile
          label="Active Closings"
          value={totalActive}
          description={`Excludes Sent to AR & fully-done • ${pageRangeLabel}`}
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
          label="Failed Cases"
          value={failedQueue.length}
          description="Failed closings"
          accent={failedQueue.length > 0 ? '#b91c1c' : undefined}
        />
        <StatTile
          label="Waiting on User"
          value={totalWaitingOnUser}
          description="RPTT, Validate, or awaiting AR"
          accent={totalWaitingOnUser > 0 ? '#1d4ed8' : undefined}
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
            <p className="py-6 text-center text-xs text-[#8a8578]">
              No active closings to chart yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius="52%"
                      outerRadius="80%"
                      paddingAngle={2}
                      cornerRadius={6}
                      stroke="#F5F2EC"
                      strokeWidth={2}
                      activeShape={renderActiveSlice}
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
                      cursor={false}
                      formatter={(value, name) => [
                        `${value} closing${value === 1 ? '' : 's'}`,
                        String(name),
                      ]}
                      contentStyle={TOOLTIP_STYLE}
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
            <p className="py-6 text-center text-xs text-[#8a8578]">
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
            <p className="py-6 text-center text-xs text-[#8a8578]">
              Nothing pending right now.
            </p>
          ) : (
            <div style={{ width: '100%', height: Math.max(150, pendingActions.length * 34) }}>
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
                    cursor={false}
                    formatter={(value) => [
                      `${value} pending`,
                      'Actions',
                    ]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    onMouseEnter={pendingBarHover.onMouseEnter}
                    onMouseLeave={pendingBarHover.onMouseLeave}
                  >
                    {pendingActions.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fillOpacity={pendingBarHover.opacityFor(index)}
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

        <QueueSection
          icon={<AlertCircle className="size-4 text-[#b91c1c]" />}
          title="Failed Cases"
          emptyMessage="No failed closings right now."
          entries={failedQueue}
          tone="red"
          onSelectTicket={onSelectTicket}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm lg:col-span-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-[#1E3A47]" />
              <h2 className="text-sm font-semibold text-[#1E3A47]">
                All-Time Status Distribution
              </h2>
            </div>
            {firstCompletedDate && (
              <div className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                <input
                  type="date"
                  aria-label="Status distribution range from"
                  className="h-7 rounded-md border border-[#D5CBB8] bg-white px-1.5 text-[11px] text-[#1E3A47]"
                  value={statusRangeFrom}
                  min={firstCompletedDate.slice(0, 10)}
                  max={statusRangeTo || today}
                  onChange={(e) => setStatusRangeFrom(e.target.value)}
                />
                <span>to</span>
                <input
                  type="date"
                  aria-label="Status distribution range to"
                  className="h-7 rounded-md border border-[#D5CBB8] bg-white px-1.5 text-[11px] text-[#1E3A47]"
                  value={statusRangeTo}
                  min={statusRangeFrom || firstCompletedDate.slice(0, 10)}
                  max={today}
                  onChange={(e) => setStatusRangeTo(e.target.value)}
                />
                {(statusRangeFrom || statusRangeTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusRangeFrom('')
                      setStatusRangeTo('')
                    }}
                    className="font-semibold text-[#1E3A47] underline-offset-2 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ width: '100%', height: 260 }}>
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
                <Tooltip cursor={false} contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={statusBarHover.onMouseEnter}
                  onMouseLeave={statusBarHover.onMouseLeave}
                >
                  {allStatusCounts.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill="#1E3A47"
                      fillOpacity={statusBarHover.opacityFor(index)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Send className="size-4 text-[#1d4ed8]" />
              <h2 className="text-sm font-semibold text-[#1E3A47]">
                Waiting on User
              </h2>
            </div>
            <div className="flex shrink-0 rounded-md border border-[#D5CBB8] p-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]">
              <button
                type="button"
                onClick={() => setWaitingView('status')}
                className={`rounded px-2 py-1 transition ${
                  waitingView === 'status'
                    ? 'bg-[#1E3A47] text-[#F5F2EC]'
                    : 'text-[#5F5E5A] hover:text-[#1E3A47]'
                }`}
              >
                By Status
              </button>
              <button
                type="button"
                onClick={() => setWaitingView('user')}
                className={`rounded px-2 py-1 transition ${
                  waitingView === 'user'
                    ? 'bg-[#1E3A47] text-[#F5F2EC]'
                    : 'text-[#5F5E5A] hover:text-[#1E3A47]'
                }`}
              >
                By User
              </button>
            </div>
          </div>

          {totalWaitingOnUser === 0 ? (
            <p className="py-6 text-center text-xs text-[#8a8578]">
              Nothing waiting on a user right now.
            </p>
          ) : (
            <div
              style={{
                width: '100%',
                height:
                  waitingView === 'status'
                    ? 150
                    : Math.max(150, waitingOnUserByAgent.length * 34),
              }}
            >
              <ResponsiveContainer>
                <BarChart
                  data={
                    waitingView === 'status'
                      ? waitingOnUserByStatus
                      : waitingOnUserByAgent
                  }
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} stroke="#EDE8E0" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#8a8578' }}
                    axisLine={{ stroke: '#D5CBB8' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 10, fill: '#1E3A47' }}
                    axisLine={{ stroke: '#D5CBB8' }}
                  />
                  <Tooltip
                    cursor={false}
                    formatter={(value) => [`${value} closings`, '']}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    onMouseEnter={waitingBarHover.onMouseEnter}
                    onMouseLeave={waitingBarHover.onMouseLeave}
                  >
                    {(waitingView === 'status'
                      ? waitingOnUserByStatus
                      : waitingOnUserByAgent
                    ).map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fillOpacity={waitingBarHover.opacityFor(index)}
                        fill={
                          waitingView === 'status'
                            ? '#1d4ed8'
                            : entry.name === 'Other'
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

      <div className="grid gap-4 md:grid-cols-4">
        <StatTile
          label="Total Closings"
          value={performance.total}
          description={`Every status • ${pageRangeLabel}`}
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
          label="Failure Rate"
          value={`${performance.failureRate.toFixed(0)}%`}
          description={`${performance.failed} failed closings`}
          accent={performance.failed > 0 ? '#b91c1c' : undefined}
        />
      </div>

      <section className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="size-4 text-[#1E3A47]" />
          <h2 className="text-sm font-semibold text-[#1E3A47]">
            Created vs. Completed (last 6 months)
          </h2>
        </div>

        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <LineChart
              data={trendData}
              margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#EDE8E0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#8a8578' }}
                axisLine={{ stroke: '#D5CBB8' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#8a8578' }}
                axisLine={{ stroke: '#D5CBB8' }}
              />
              <Tooltip cursor={false} contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="Created"
                stroke="#1E3A47"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#1E3A47' }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="Completed"
                stroke="#C9A96E"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#C9A96E' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ backgroundColor: '#1E3A47' }}
            />
            Created
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ backgroundColor: '#C9A96E' }}
            />
            Completed (incl. Sent to AR)
          </span>
        </div>
      </section>
    </motion.div>
  )
}

function QueueSection({
  icon,
  title,
  emptyMessage,
  entries,
  tone,
  onSelectTicket,
}: {
  icon: ReactNode
  title: string
  emptyMessage: string
  entries: QueueEntry[]
  tone: 'red' | 'blue'
  onSelectTicket: (recordId: string) => void
}) {
  const toneClasses =
    tone === 'red'
      ? 'border-[#fecaca] bg-[#FEF2F2] hover:bg-[#fde3e3]'
      : 'border-[#bfdbfe] bg-[#EFF6FF] hover:bg-[#dbeafe]'
  const tagClasses =
    tone === 'red'
      ? 'bg-[#fecaca] text-[#991b1b]'
      : 'bg-[#bfdbfe] text-[#1e40af]'
  const labelColor = tone === 'red' ? 'text-[#b91c1c]' : 'text-[#1d4ed8]'

  return (
    <section className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm lg:col-span-2">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-[#1E3A47]">{title}</h2>
        {entries.length > 0 && (
          <span className={`ml-auto text-xs font-semibold ${labelColor}`}>
            {entries.length}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#8a8578]">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelectTicket(entry.id)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-left transition ${toneClasses}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Avatar name={entry.agent} size="xs" />
                    <span className="truncate text-xs font-semibold text-[#1E3A47]">
                      {entry.ticketId}
                    </span>
                  </span>
                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${tagClasses}`}
                  >
                    <Clock className="size-2.5" />
                    Pending {entry.ageDays}d
                  </span>
                </div>
                <p
                  className="mt-0.5 truncate text-[11px] text-[#6b6358]"
                  title={entry.detail}
                >
                  {entry.detail}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
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
