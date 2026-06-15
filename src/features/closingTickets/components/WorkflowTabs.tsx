import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type WorkflowTabKey =
  | 'details'
  | 'invoice'
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
  activeTab,
  children,
}: WorkflowTabsProps) {
  return (
    <section className="border border-slate-200 bg-white shadow-sm shadow-slate-200/60 rounded-xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="bg-slate-50 p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

export function WorkflowTabBar({
  tabs,
  activeTab,
  onTabChange,
}: Omit<WorkflowTabsProps, 'children'>) {
  return (
    <div className="flex gap-1 overflow-x-auto bg-white px-4 py-2 border-b border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={
            activeTab === tab.key
              ? 'relative rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm'
              : 'rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950'
          }
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
