import type { ComponentType, ReactNode } from 'react'
import {
  Banknote,
  FileText,
  Receipt,
  Send,
  UserPlus,
} from 'lucide-react'

export type WorkflowTabKey =
  | 'details'
  | 'invoice'
  | 'charges'
  | 'newOwner'
  | 'sendToATeam'

export type WorkflowTab = {
  key: WorkflowTabKey
  label: string
}

const WORKFLOW_TAB_ICONS: Record<
  WorkflowTabKey,
  ComponentType<{ className?: string }>
> = {
  details: FileText,
  invoice: Receipt,
  charges: Banknote,
  newOwner: UserPlus,
  sendToATeam: Send,
}

interface WorkflowTabsProps {
  tabs: WorkflowTab[]
  activeTab: WorkflowTabKey
  onTabChange: (tab: WorkflowTabKey) => void
  children: ReactNode
}

export function WorkflowTabs({
  children,
}: WorkflowTabsProps) {
  return (
    <section
      className="border border-[#D5CBB8] bg-white shadow-sm"
      style={{ borderRadius: '12px' }}
    >
      <div className="bg-[#FAF8F4] p-3">{children}</div>
    </section>
  )
}

interface WorkflowTabBarProps
  extends Omit<WorkflowTabsProps, 'children'> {
  /**
   * Tab-specific action buttons (e.g. Generate Invoice, Generate New Owner
   * Ticket) rendered right-aligned in this same row. This bar is already
   * sticky at the page level, so anything placed here stays visible while
   * scrolling the tab's content below — no nested sticky positioning needed.
   */
  actions?: ReactNode
  /**
   * Receives the actions slot's DOM node so a tab whose controls live in a
   * self-contained child component (see tabBarActionsPortal.ts) can portal
   * into it, alongside whatever's passed via `actions`.
   */
  actionsContainerRef?: (node: HTMLDivElement | null) => void
}

export function WorkflowTabBar({
  tabs,
  activeTab,
  onTabChange,
  actions,
  actionsContainerRef,
}: WorkflowTabBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#D5CBB8] bg-white px-4 py-1.5">
      <div className="flex min-w-0 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = WORKFLOW_TAB_ICONS[tab.key]
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              className={
                isActive
                  ? 'relative inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1E3A47] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-[#F5F2EC] shadow-sm transition'
                  : 'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-[#5F5E5A] transition hover:bg-[#F5F2EC] hover:text-[#1E3A47]'
              }
              onClick={() => onTabChange(tab.key)}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        ref={actionsContainerRef}
        className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2"
      >
        {actions}
      </div>
    </div>
  )
}
