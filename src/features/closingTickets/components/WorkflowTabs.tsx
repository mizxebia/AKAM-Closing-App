import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type WorkflowTabKey =
  | 'details'
  | 'invoice'
  | 'documents'
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
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
      <div className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
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
