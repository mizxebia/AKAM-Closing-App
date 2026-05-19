import type { ReactNode } from 'react'

export type WorkflowTabKey =
  | 'details'
  | 'charges'
  | 'newOwner'

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
  tabs,
  activeTab,
  onTabChange,
  children,
}: WorkflowTabsProps) {
  return (
    <section className="workflow-shell">
      <div className="workflow-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={
              activeTab === tab.key
                ? 'workflow-tab workflow-tab-active'
                : 'workflow-tab'
            }
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="workflow-tab-panel">{children}</div>
    </section>
  )
}
