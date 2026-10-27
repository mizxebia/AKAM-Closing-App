import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, PieChart as PieChartIcon, Users } from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Avatar, getColorForName } from '../../../components/enterprise'
import { getClosingTicketStatusDisplay } from '../utils/closingTicketFormatters'
import type { ClosingTicketRecord } from '../types/closingTicket'

// Sent to AR — excluded everywhere in this panel since those closings have
// already moved on from the agent's active workload.
const SENT_TO_AR_STATUS = 396620001

// Beyond this many distinct agents, the smallest slices are grouped into
// a single "Other" wedge so the pie stays readable.
const MAX_PIE_SLICES = 7

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

function buildAgentActivity(
  records: ClosingTicketRecord[]
): AgentActivity[] {
  const counts = new Map<string, number>()

  for (const record of records) {
    if (Number(record.cr7de_ticketstatus) === SENT_TO_AR_STATUS) {
      continue
    }
    const agent = record.cr7de_closingagentname?.trim() || 'Unassigned'
    counts.set(agent, (counts.get(agent) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function buildPieData(agents: AgentActivity[]) {
  if (agents.length <= MAX_PIE_SLICES) return agents

  const top = agents.slice(0, MAX_PIE_SLICES - 1)
  const rest = agents.slice(MAX_PIE_SLICES - 1)
  const otherCount = rest.reduce((sum, a) => sum + a.count, 0)

  return [...top, { name: 'Other', count: otherCount }]
}

function buildStatusBreakdown(
  records: ClosingTicketRecord[]
): StatusBreakdownEntry[] {
  const counts = new Map<number, number>()

  for (const record of records) {
    const status = Number(record.cr7de_ticketstatus)
    if (status === SENT_TO_AR_STATUS) continue
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

interface UserActivityPanelProps {
  records: ClosingTicketRecord[]
  onBack: () => void
}

export function UserActivityPanel({
  records,
  onBack,
}: UserActivityPanelProps) {
  const agents = useMemo(
    () => buildAgentActivity(records),
    [records]
  )
  const pieData = useMemo(() => buildPieData(agents), [agents])
  const statusBreakdown = useMemo(
    () => buildStatusBreakdown(records),
    [records]
  )

  const totalActive = agents.reduce((sum, a) => sum + a.count, 0)
  const topAgent = agents[0]

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

      <div className="grid gap-4 md:grid-cols-3">
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
    </motion.div>
  )
}

function StatTile({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  return (
    <div className="rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm">
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
