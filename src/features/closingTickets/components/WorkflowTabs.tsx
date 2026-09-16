import type { ReactNode } from 'react'

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
    <section className="border border-slate-200 bg-white shadow-sm shadow-slate-200/60 rounded-xl">
      <div className="bg-slate-50 p-4">
        {children}
      </div>
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
    <div className="flex items-center justify-between gap-3 bg-white px-4 py-2 border-b border-slate-200">
      <div className="flex min-w-0 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={
              activeTab === tab.key
                ? 'relative shrink-0 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm'
                : 'shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950'
            }
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
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
