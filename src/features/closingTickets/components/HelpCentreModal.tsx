import { useState, useEffect, useRef } from 'react'
import {
  X, BookOpen, FileText, Loader2, ClipboardCheck,
  Upload, SearchCheck, BadgeCheck, CheckCircle2,
  Clock, AlertTriangle, Info, ChevronDown, ChevronUp,
  Zap, ArrowRight,
} from 'lucide-react'
import { cn } from '../../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'user' | 'desktop' | 'cloud'
type OutcomeVariant = 'success' | 'failure'
type HelpTab = 'quick' | 'process'

interface StatusEntry { label: string; value: string }
interface StepCardProps {
  variant: BadgeVariant; stage: string; title: string
  subtitle: string; statuses: StatusEntry[]
}
interface OutcomeProps { variant: OutcomeVariant; statuses: StatusEntry[] }
interface DecisionRowProps { success: StatusEntry[]; failure: StatusEntry[] }
interface NoteBoxProps { icon: string; title: string; children: React.ReactNode }
interface PhaseHeaderProps { number: string; title: string }

// ─── Status card data ─────────────────────────────────────────────────────────

interface StatusCard {
  status: string; color: string; lightBg: string; lightBorder: string
  icon: React.ReactNode; what: string; action: string
  isUserAction: boolean; estimatedTime?: string; steps?: string[]
}

const STATUS_CARDS: StatusCard[] = [
  {
    status: 'Draft', color: '#64748B', lightBg: '#F8FAFC', lightBorder: '#E2E8F0',
    icon: <FileText size={16} />,
    what: 'Your ticket was created. The system is about to start processing it.',
    action: 'Nothing — sit tight, automation kicks off shortly.',
    isUserAction: false, estimatedTime: '< 1 min',
  },
  {
    status: 'Processing', color: '#2563EB', lightBg: '#EFF6FF', lightBorder: '#BFDBFE',
    icon: <Loader2 size={16} />,
    what: 'The system is pulling Domecile data, seller info, and the purchase application form. Desktop flows run in batches when the automation server is free — your ticket will be picked up in the next available run. If the building is not on Domecile, the ticket enters Processing immediately after creation (you uploaded the form manually) and skips directly to purchase form data extraction.',
    action: 'Nothing — automation is running. Desktop flows can take up to a few hours depending on how many tickets are ahead in the queue. Check back later.',
    isUserAction: false, estimatedTime: '~5 min per step + queue time',
  },
  {
    status: 'Ready for Post Closing', color: '#7C3AED', lightBg: '#F5F3FF', lightBorder: '#DDD6FE',
    icon: <ClipboardCheck size={16} />,
    what: 'The purchase form has been extracted. The system is waiting for you to upload the RPTT document.',
    action: '',
    isUserAction: true, estimatedTime: 'Your action needed',
    steps: [
      'Go to the Closing Details tab',
      'Upload the RPTT / ACRIS document',
      'Click Save',
      'Click "Move to Post Closing"',
    ],
  },
  {
    status: 'Post Closing', color: '#0284C7', lightBg: '#F0F9FF', lightBorder: '#BAE6FD',
    icon: <Upload size={16} />,
    what: 'The RPTT document is uploaded. The system is extracting data from it and fetching YARDI charges. YARDI charge retrieval is a desktop flow and runs in batches — it can take up to 10–15 minutes per ticket plus any queue wait time.',
    action: 'Nothing — wait for the system to finish. YARDI charges can take up to 10–15 min per ticket. If the VM is busy with other tickets, it may take longer.',
    isUserAction: false, estimatedTime: '10–15 min + queue time',
  },
  {
    status: 'Validate Closings', color: '#B45309', lightBg: '#FFFBEB', lightBorder: '#FDE68A',
    icon: <SearchCheck size={16} />,
    what: 'Everything is ready. The system has finished all automated steps.',
    action: '',
    isUserAction: true, estimatedTime: 'Your action needed',
    steps: [
      'Go to the New Owner Ticket tab',
      'Review all the details carefully',
      'If not done yet, click "Generate New Owner Ticket"',
      'Confirm all three documents are present (Purchase Form, RPTT, New Owner Ticket)',
      'Click "Validate" — this cannot be undone',
    ],
  },
  {
    status: 'Transferring Building', color: '#1E3A47', lightBg: '#F0F4F6', lightBorder: '#CBD5E1',
    icon: <BadgeCheck size={16} />,
    what: 'You\'ve validated the ticket. The system is updating seller details and creating the new owner record in YARDI. Both are desktop flows that run in batches — seller update takes ~5 min and owner creation can take 10–15 min per ticket.',
    action: 'Nothing — the ticket is now locked. Automation is finishing up. Total time for this phase is typically 15–20 min per ticket, plus any queue wait time.',
    isUserAction: false, estimatedTime: '15–20 min + queue time',
  },
  {
    status: 'Completed', color: '#059669', lightBg: '#ECFDF5', lightBorder: '#A7F3D0',
    icon: <CheckCircle2 size={16} />,
    what: 'The new owner has been created in YARDI. This closing is done.',
    action: 'Nothing — this closing is finished. 🎉',
    isUserAction: false, estimatedTime: 'Done',
  },
  {
    status: 'Failed', color: '#DC2626', lightBg: '#FEF2F2', lightBorder: '#FECACA',
    icon: <AlertTriangle size={16} />,
    what: 'An automated step encountered an error. If the failure happened at Domecile dump retrieval or seller info retrieval, it may be related to the ticket data. For any other step, it is most likely a bot or automation issue — your data is fine.',
    action: '',
    isUserAction: true, estimatedTime: 'Action required',
    steps: [
      'Check the failure reason banner at the top of the ticket — it will describe which step failed',
      'If it failed at Domecile dump or seller info retrieval: verify that the Building Code and NYC Code are correct. If they look right, it may still be a bot issue',
      'If it failed at any other step: this is most likely a bot or automation issue, not a problem with your data. No changes are needed from you',
      'In either case, please reach out to the Xebia team — they will investigate and reset the status from the backend',
    ],
  },
]

// ─── Flowchart palette ────────────────────────────────────────────────────────

const BADGE: Record<BadgeVariant, { bar: string; badge: string; border: string }> = {
  user:    { bar: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 border border-blue-200',     border: 'border-blue-200' },
  desktop: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', border: 'border-emerald-200' },
  cloud:   { bar: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 border border-violet-200', border: 'border-violet-200' },
}
const BADGE_LABEL: Record<BadgeVariant, string> = {
  user: 'User Action', desktop: 'Desktop Automation', cloud: 'Cloud Automation',
}

// ─── Status Timeline Card ─────────────────────────────────────────────────────

function StatusTimelineCard({ card, isLast }: { card: StatusCard; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative flex gap-4">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 shadow-sm"
          style={{ background: card.lightBg, borderColor: card.color, color: card.color }}
        >
          {card.icon}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 mt-1.5" style={{ background: `${card.color}30`, minHeight: 20 }} />
        )}
      </div>

      {/* Card */}
      <div
        className="mb-4 flex-1 overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md"
        style={{
          background: card.lightBg,
          borderColor: card.lightBorder,
          boxShadow: expanded ? `0 4px 20px ${card.color}18` : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <button type="button" className="w-full text-left px-5 py-4" onClick={() => setExpanded(v => !v)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[14px] font-bold" style={{ color: card.color }}>{card.status}</span>
                {card.isUserAction ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: `${card.color}15`, color: card.color, border: `1px solid ${card.color}30` }}>
                    <Zap size={9} /> Action Required
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Automated
                  </span>
                )}
                {card.estimatedTime && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-400">
                    <Clock size={9} /> {card.estimatedTime}
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-slate-600 leading-relaxed pr-4">{card.what}</p>
            </div>
            <div className="shrink-0 text-slate-400 mt-0.5">
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="border-t px-5 py-4" style={{ borderColor: card.lightBorder }}>
            {card.steps && card.steps.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: card.color }}>
                  What you need to do
                </p>
                {card.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 text-white"
                      style={{ background: card.color }}>
                      {i + 1}
                    </div>
                    <p className="text-[12.5px] text-slate-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-blue-700 mb-0.5">Automation in Progress</p>
                  <p className="text-[12px] text-blue-600 leading-relaxed">{card.action}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Good-to-know cards ───────────────────────────────────────────────────────

interface BehaviourCard { icon: string; title: string; body: string }

const BEHAVIOURS: BehaviourCard[] = [
  { icon: '🏢', title: 'Building not on Domecile — manual upload path',
    body: 'When the "Building not on Domecile" flag is checked, automated Domecile dump and purchase form download stages are skipped. You must upload the Purchase Application Form manually in the Closing Details tab before saving. On save, the ticket jumps straight to Processing with Bot Status FormDownloaded and continues from Stage 6 (data extraction) onward.' },
  { icon: '📄', title: 'Three documents required before Validate',
    body: 'The Validate button only appears when all three documents are present: Purchase Application Form, RPTT / ACRIS Document, and New Owner Ticket PDF.' },
  { icon: '🔒', title: 'Validation is permanent — ticket locks forever',
    body: 'Once you click Validate, the ticket becomes fully read-only. No fields, documents, or charges can be changed. Double-check everything first.' },
  { icon: '↩', title: 'Deleting the RPTT rolls the ticket back',
    body: 'If you delete the RPTT while in Post Closing or Validate Closings, the ticket automatically returns to Ready for Post Closing.' },
  { icon: '🎫', title: 'Generate New Owner Ticket before Validate',
    body: 'Click "Generate New Owner Ticket" in the New Owner Ticket tab first. The PDF must be generated before the Validate button appears.' },
  { icon: '👁', title: 'All documents are viewable inside the app',
    body: 'Once uploaded or generated, all documents are viewable directly in the document panel on the right side of the ticket.' },
  { icon: '💬', title: 'Ticket showing as Failed?',
    body: 'A banner at the top of the ticket will describe what went wrong. Review the details, make any necessary corrections, and reach out to the Xebia team — they will investigate and reset the status from the backend.' },
]

function BehaviourCardItem({ card }: { card: BehaviourCard }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-xl mb-2">{card.icon}</div>
      <p className="text-[13px] font-semibold text-slate-800 mb-1.5 leading-snug">{card.title}</p>
      <p className="text-[12px] text-slate-500 leading-relaxed">{card.body}</p>
    </div>
  )
}

// ─── Workflow progress stepper ────────────────────────────────────────────────

const PROGRESS_STEPS = ['Draft', 'Processing', 'Ready', 'Post Closing', 'Validation', 'Completed']

function WorkflowProgress() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-5 shadow-sm space-y-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E]">
        Workflow Progression
      </p>
      <div className="flex items-center">
        {PROGRESS_STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className="flex size-7 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-50 text-[10px] font-bold text-slate-500">
                {i + 1}
              </div>
              <p className="text-[9px] text-slate-400 mt-1 text-center leading-tight whitespace-nowrap">{step}</p>
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1 mb-4 bg-slate-200" />
            )}
          </div>
        ))}
      </div>

      {/* Timing note */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <Clock size={14} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-amber-800 mb-1">About automation timing</p>
          <p className="text-[11.5px] text-amber-700 leading-relaxed">
            Desktop flows (seller info, form download, YARDI charges, seller update, owner creation) run in batches — they process multiple tickets in sequence whenever the automation server is free.
            Each ticket is picked up in the next scheduled run, which can be up to a few hours apart.
            Cloud flows run faster and typically complete within 1–5 minutes.
            <br /><br />
            <strong>Per-ticket estimates (once a run starts):</strong> Seller info ~5 min · Form download ~3 min · YARDI charges 10–15 min · Seller update ~5 min · Owner creation 10–15 min.
            Overall end-to-end time varies based on how many tickets are in the queue.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Quick Reference Tab ──────────────────────────────────────────────────────

function QuickReferenceContent() {
  const [filter, setFilter] = useState('')
  const refs = useRef<Record<string, HTMLDivElement | null>>({})

  const filtered = STATUS_CARDS.filter(c =>
    c.status.toLowerCase().includes(filter.toLowerCase()) ||
    c.what.toLowerCase().includes(filter.toLowerCase())
  )

  const quickJumps = ['Draft', 'Processing', 'Post Closing', 'Validation', 'Failed']
  const scrollTo = (label: string) => {
    const key = STATUS_CARDS.find(c => c.status.toLowerCase().includes(label.toLowerCase()))?.status
    if (key && refs.current[key]) refs.current[key]!.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-5">
      <WorkflowProgress />

      {/* Search + quick jumps */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <SearchCheck size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search status..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder-slate-400 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {quickJumps.map(label => (
            <button key={label} type="button" onClick={() => scrollTo(label)}
              className="inline-flex items-center gap-1 rounded-full border border-[#D5CBB8] bg-white px-3 py-1 text-[11px] font-semibold text-[#1E3A47] transition hover:bg-[#F5F2EC] hover:border-[#C9A96E]">
              {label} <ArrowRight size={9} />
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Status Guide</p>
        <div>
          {filtered.map((card, i) => (
            <div key={card.status} ref={el => { refs.current[card.status] = el }}>
              <StatusTimelineCard card={card} isLast={i === filtered.length - 1} />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 py-10 text-center text-slate-400 text-[13px]">
              No matching statuses found.
            </div>
          )}
        </div>
      </div>

      {/* Good to know */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Good to Know</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {BEHAVIOURS.map(card => <BehaviourCardItem key={card.title} card={card} />)}
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 pt-2">
        New Sales Closure &nbsp;·&nbsp; AKAM Associates &nbsp;·&nbsp; Closing Management System
      </p>
    </div>
  )
}

// ─── Flowchart primitives (Process Overview) ──────────────────────────────────

function Arrow({ short = false }: { short?: boolean }) {
  return (
    <div className="flex flex-col items-center" style={{ height: short ? 20 : 28 }}>
      <div className="w-px flex-1 bg-slate-300" />
      <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '7px solid #CBD5E1' }} />
    </div>
  )
}

function PhaseHeader({ number, title }: PhaseHeaderProps) {
  return (
    <div className="flex items-center gap-3 w-full rounded-2xl px-5 py-3"
      style={{ background: '#1E3A47', border: '1px solid rgba(201,169,110,0.25)' }}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] opacity-70 whitespace-nowrap">{number}</span>
      <div className="h-3 w-px bg-[#C9A96E]/30" />
      <span className="text-[14px] font-bold text-white tracking-tight">{title}</span>
    </div>
  )
}

function StatusPanel({ statuses }: { statuses: StatusEntry[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-[185px] shrink-0">
      {statuses.map(({ label, value }) => (
        <div key={label} className="flex items-baseline gap-2 leading-relaxed">
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 whitespace-nowrap">{label}</span>
          <span className="text-[11px] font-semibold text-slate-700">{value}</span>
        </div>
      ))}
    </div>
  )
}

function StepCard({ variant, stage, title, subtitle, statuses }: StepCardProps) {
  const c = BADGE[variant]
  return (
    <div className={cn('relative flex gap-3 w-full rounded-2xl border bg-white pl-6 pr-4 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5', c.border)}>
      <div className={cn('absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl', c.bar)} />
      <div className="flex-1 min-w-0">
        <span className={cn('inline-block text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5', c.badge)}>
          {BADGE_LABEL[variant]}
        </span>
        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{stage}</p>
        <p className="text-[14px] font-bold text-slate-800 leading-snug mt-0.5">{title}</p>
        <p className="text-[11px] text-slate-500 italic mt-0.5">{subtitle}</p>
      </div>
      <StatusPanel statuses={statuses} />
    </div>
  )
}

function Outcome({ variant, statuses }: OutcomeProps) {
  const isSuccess = variant === 'success'
  return (
    <div className={cn('flex-1 rounded-xl border px-4 py-3 text-[11px]',
      isSuccess ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
      <div className={cn('flex items-center gap-2 font-bold mb-2', isSuccess ? 'text-emerald-700' : 'text-red-600')}>
        <div className={cn('flex size-4 items-center justify-center rounded-full text-white text-[9px] font-black shrink-0', isSuccess ? 'bg-emerald-500' : 'bg-red-500')}>
          {isSuccess ? '✓' : '✕'}
        </div>
        {isSuccess ? 'Success' : 'Failure'}
      </div>
      {statuses.map(({ label, value }) => (
        <div key={label} className="leading-[1.75]">
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label} </span>
          <span className="font-semibold text-slate-700">{value}</span>
        </div>
      ))}
    </div>
  )
}

function DecisionRow({ success, failure }: DecisionRowProps) {
  return (
    <div className="flex items-start gap-4 w-full">
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div className="flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50"
          style={{ width: 52, height: 52, transform: 'rotate(45deg)' }}>
          <span className="text-[8px] font-black uppercase tracking-wide text-amber-600"
            style={{ transform: 'rotate(-45deg)', lineHeight: 1.2, textAlign: 'center' }}>Result</span>
        </div>
      </div>
      <div className="flex flex-1 gap-3">
        <Outcome variant="success" statuses={success} />
        <Outcome variant="failure" statuses={failure} />
      </div>
    </div>
  )
}

function NoteBox({ icon, title, children }: NoteBoxProps) {
  return (
    <div className="w-full rounded-2xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-[11.5px] text-slate-600 leading-relaxed">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-1">{icon} {title}</p>
      {children}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { color: '#3B82F6', label: 'User Action' },
    { color: '#10B981', label: 'Desktop Automation' },
    { color: '#8B5CF6', label: 'Cloud Automation' },
    { color: '#F59E0B', label: 'Decision / Status' },
    { color: '#EF4444', label: 'Failure Path' },
    { color: '#94A3B8', label: 'Note / Remark', dashed: true },
  ]
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 mb-6 shadow-sm">
      <p className="w-full text-center text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Legend</p>
      {items.map(({ color, label, dashed }) => (
        <div key={label} className="flex items-center gap-2 text-[11px] text-slate-600">
          <div className="size-2.5 rounded-sm shrink-0" style={{ background: color, border: dashed ? '1.5px dashed #94A3B8' : undefined }} />
          {label}
        </div>
      ))}
    </div>
  )
}

function AutomationLegendTable() {
  const rows = [
    { color: '#3B82F6', label: 'Blue',   desc: 'User Action — performed manually in the app' },
    { color: '#10B981', label: 'Green',  desc: 'Desktop Automation — Power Automate Desktop' },
    { color: '#8B5CF6', label: 'Purple', desc: 'Cloud Automation — Power Automate Cloud Flow' },
    { color: '#F59E0B', label: 'Orange', desc: 'Decision Point — Success or Failure branch' },
    { color: '#EF4444', label: 'Red',    desc: 'Failure Path — ticket enters Failed status' },
    { color: '#94A3B8', label: 'Grey',   desc: 'Note or remark — additional context' },
  ]
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: '#1E3A47' }}>
        Automation Legend
      </div>
      <table className="w-full text-[12px] border-collapse bg-white">
        <tbody>
          {rows.map(({ color, label, desc }) => (
            <tr key={label} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-2 font-semibold text-slate-700 whitespace-nowrap">
                <span className="inline-block size-2.5 rounded-sm mr-2 align-middle" style={{ background: color }} />{label}
              </td>
              <td className="px-4 py-2 text-slate-500">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Flowchart content ────────────────────────────────────────────────────────

function FlowchartContent() {
  return (
    <div className="flex flex-col items-center gap-0 max-w-3xl mx-auto">
      <PhaseHeader number="Phase 1" title="Ticket Creation" />
      <Arrow />
      <StepCard variant="user" stage="Stage 1" title="Create Closing Ticket"
        subtitle="User fills in: Building Code, Unit Number, Package Type"
        statuses={[{ label: 'Ticket Status', value: 'Draft' }, { label: 'Bot Status', value: 'Draft' }]} />
      <Arrow />

      {/* Building Not on Domecile — Alternate Path callout */}
      <div className="w-full rounded-2xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-[11.5px] text-slate-600 leading-relaxed">
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-2">
          🏢 Building Not on Domecile — Alternate Path
        </p>
        <p>
          If the <strong className="text-slate-700">"Building not on Domecile"</strong> flag is checked, the automated Domecile dump
          and purchase form download stages are skipped. Instead, the user must{' '}
          <strong className="text-slate-700">manually upload the Purchase Application Form</strong> in the Closing Details tab
          and click Save. On save, the system automatically sets Ticket Status to{' '}
          <strong className="text-slate-700">Processing</strong> and Bot Status to{' '}
          <strong className="text-slate-700">FormDownloaded</strong>, then continues from Stage 6 onwards.
        </p>
      </div>
      <Arrow />

      <PhaseHeader number="Phase 2" title="Seller Information Collection" />
      <Arrow />
      <StepCard variant="cloud" stage="Stage 2" title="Retrieve Domecile Information"
        subtitle="Cloud Flow: NSC_DOMECILE_DUMP"
        statuses={[{ label: 'Trigger', value: 'Bot Status = Draft' }]} />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'Processing' }, { label: 'Bot Status', value: 'DomecileDumpRetrieved' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedDomecileDumpRetrieval' }]} />
      <Arrow />
      <StepCard variant="desktop" stage="Stage 3" title="Retrieve Seller Information"
        subtitle="Desktop Flow: NSC Yardi Seller Details"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 2 success' }]} />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'Processing' }, { label: 'Bot Status', value: 'SellerInfoRetrieved' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedSellerInfoRetrieval' }]} />
      <Arrow />
      <StepCard variant="desktop" stage="Stage 4" title="Download Purchase Application Form"
        subtitle="Desktop Flow: NSC Purchase Application Form Download"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 3 success' }]} />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'Processing' }, { label: 'Bot Status', value: 'FormDownloaded' }]}
        failure={[{ label: 'Ticket Status', value: 'Processing' }, { label: 'Bot Status', value: 'FailedFormDownload' }]} />
      <Arrow short />
      <NoteBox icon="📌" title="Note">
        The ticket stays in <strong>Processing</strong> on form download failure because this step can be automatically retried.
      </NoteBox>
      <Arrow />
      <StepCard variant="cloud" stage="Stage 5" title="Upload Purchase Form to Document Storage"
        subtitle="Cloud Flow: NSC_PurchaseFormUpload"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 4 success' }]} />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'Processing' }, { label: 'Bot Status', value: 'PurchaseFormUploadOnedrive' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedPurchaseFormUploadOnedrive' }]} />
      <Arrow />
      <StepCard variant="cloud" stage="Stage 6" title="Extract Purchase Form Information"
        subtitle="Cloud Flow: NSC_PurchaseApplication_DataExtraction"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 5 success' }]} />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'ReadyForPostClosing' }, { label: 'Bot Status', value: 'PurchaseFormDataExtracted' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedPurchaseFormDataExtraction' }]} />
      <Arrow />

      <PhaseHeader number="Phase 3" title="Post-Closing Preparation" />
      <Arrow />
      <StepCard variant="user" stage="Stage 7a" title="Upload RPTT / ACRIS Document"
        subtitle="User attaches the RPTT document in Closing Details and clicks Save"
        statuses={[{ label: 'Ticket Status', value: 'ReadyForPostClosing' }, { label: 'Bot Status', value: 'RPTTUploaded' }]} />
      <Arrow />
      <StepCard variant="user" stage="Stage 7b" title="Move to Post Closing"
        subtitle='User clicks "Move to Post Closing" (only visible after RPTT is uploaded)'
        statuses={[{ label: 'Ticket Status', value: 'PostClosing' }, { label: 'Bot Status', value: 'RPTTUploaded (unchanged)' }]} />
      <Arrow short />
      <NoteBox icon="↩" title="Rollback Rule">
        If the RPTT is <strong>deleted</strong> while in <strong>Post Closing</strong> or <strong>Validate Closings</strong>, the ticket rolls back to <strong>ReadyForPostClosing</strong> automatically.
      </NoteBox>
      <Arrow />

      <PhaseHeader number="Phase 4" title="Validation Preparation" />
      <Arrow />
      <StepCard variant="cloud" stage="Stage 8" title="Extract RPTT Document Information"
        subtitle="Cloud Flow: NSC_RPTT_DataExtraction"
        statuses={[{ label: 'Trigger', value: 'Bot Status = RPTTUploaded' }]} />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'ValidateClosings' }, { label: 'Bot Status', value: 'RPTTExtracted' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedRPTTExtraction' }]} />
      <Arrow />
      <StepCard variant="desktop" stage="Stage 9" title="Retrieve YARDI Charges"
        subtitle="Desktop Flow: NSC Fetch YARDI Charges"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 8 success' }]} />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'ValidateClosings' }, { label: 'Bot Status', value: 'YARDIChargesFetched' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: '—' }]} />
      <Arrow />

      <PhaseHeader number="Phase 5" title="Business Validation" />
      <Arrow />
      <StepCard variant="user" stage="Stage 10" title="Validate Closing Information"
        subtitle='User reviews all info and clicks "Validate" in the New Owner Ticket tab'
        statuses={[{ label: 'Before', value: 'ValidateClosings' }, { label: 'Ticket Status', value: 'TransferringBuilding' }, { label: 'Bot Status', value: 'InformationValidated' }]} />
      <Arrow short />
      <NoteBox icon="✅" title="Validation Requirements">
        The Validate button requires all three documents: <strong>Purchase Application Form</strong>, <strong>RPTT Document</strong>, and <strong>New Owner Ticket PDF</strong>.
        <br /><br />
        <strong>🔒 Read-Only Lock —</strong> Once validated, the ticket cannot be modified.
      </NoteBox>
      <Arrow />

      <PhaseHeader number="Phase 6" title="Ownership Transfer" />
      <Arrow />
      <StepCard variant="desktop" stage="Stage 11" title="Update Seller Information in YARDI"
        subtitle="Desktop Flow: NSC Yardi Seller Update"
        statuses={[{ label: 'Trigger', value: 'Bot Status = InformationValidated' }]} />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'TransferringBuilding' }, { label: 'Bot Status', value: 'SellerDetailsUpdated' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedSellerInfoRetrieval' }]} />
      <Arrow />
      <StepCard variant="desktop" stage="Stage 12" title="Create New Owner in YARDI"
        subtitle="Desktop Flow: NSC Yardi Create New Owner"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 11 success' }]} />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'Completed' }, { label: 'Bot Status', value: 'OwnerRecordCreated' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedCreateNewOwner' }]} />
      <Arrow short />

      <div className="w-full rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-5 py-4 flex items-center justify-between gap-4 shadow-sm">
        <div>
          <p className="text-[17px] font-bold text-emerald-700">🎉 Process Completed</p>
          <p className="text-[12px] text-emerald-600 mt-0.5">The property ownership transfer is finalised in YARDI.</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] shrink-0">
          <div className="leading-relaxed"><span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Ticket Status </span><span className="font-semibold text-emerald-700">Completed</span></div>
          <div className="leading-relaxed"><span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Bot Status </span><span className="font-semibold text-emerald-700">OwnerRecordCreated</span></div>
        </div>
      </div>

      <div className="w-full mt-8"><AutomationLegendTable /></div>
      <p className="mt-6 text-center text-[11px] text-slate-400">
        New Sales Closure Lifecycle &nbsp;·&nbsp; AKAM Associates &nbsp;·&nbsp; Closing Management System
      </p>
    </div>
  )
}

// ─── Public modal ─────────────────────────────────────────────────────────────

interface HelpCentreModalProps { open: boolean; onClose: () => void }

export function HelpCentreModal({ open, onClose }: HelpCentreModalProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>('quick')

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const tabs: { key: HelpTab; icon: React.ReactNode; label: string; sub: string }[] = [
    { key: 'quick',   icon: <ClipboardCheck size={13} />, label: 'Quick Reference', sub: 'What do I do?' },
    { key: 'process', icon: <Zap size={13} />,            label: 'Process Overview', sub: 'Full automation flow' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-3"
      style={{ background: 'rgba(15,25,40,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl rounded-3xl overflow-hidden"
        style={{
          minHeight: 'calc(100vh - 24px)',
          background: '#F5F2EC',
          border: '1px solid #E4E2DC',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)',
          animation: 'helpModalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)',
        }}
      >
        <style>{`
          @keyframes helpModalIn {
            from { opacity:0; transform:scale(0.97) translateY(8px); }
            to   { opacity:1; transform:scale(1)    translateY(0);   }
          }
        `}</style>

        {/* Header */}
        <div className="px-6 pt-5 pb-0" style={{ background: '#1E3A47', borderBottom: '1px solid rgba(201,169,110,0.2)' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl"
                style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)' }}>
                <BookOpen size={18} className="text-[#C9A96E]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C9A96E] opacity-75">Help Centre</p>
                <h2 className="text-[20px] font-bold text-white leading-tight mt-0.5"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic' }}>
                  New Sales Closure
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">Everything you need to complete a New Sales Closure.</p>
              </div>
            </div>
            <button type="button" onClick={onClose}
              className="flex size-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close Help Centre">
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {tabs.map(({ key, icon, label, sub }) => (
              <button key={key} type="button" onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all duration-200',
                  activeTab === key ? 'text-[#1E3A47]' : 'text-slate-400 hover:text-slate-200'
                )}
                style={activeTab === key ? {
                  background: '#F5F2EC',
                  borderTop: '1px solid #E4E2DC',
                  borderLeft: '1px solid #E4E2DC',
                  borderRight: '1px solid #E4E2DC',
                  borderBottom: '1px solid #F5F2EC',
                } : {}}>
                <span className={activeTab === key ? 'text-[#C9A96E]' : ''}>{icon}</span>
                <div>
                  <p className="text-[12px] font-semibold leading-none">{label}</p>
                  <p className={cn('text-[10px] mt-0.5 leading-none', activeTab === key ? 'text-slate-400' : 'text-slate-500')}>{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'quick'   && <QuickReferenceContent />}
          {activeTab === 'process' && <><Legend /><FlowchartContent /></>}
        </div>
      </div>
    </div>
  )
}
