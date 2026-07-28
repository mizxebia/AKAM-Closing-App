import { useState, useEffect, useRef } from 'react'
import {
  X, BookOpen, FileText, Loader2, ClipboardCheck,
  Upload, SearchCheck, BadgeCheck, CheckCircle2,
  Clock, AlertTriangle, Info, ChevronDown, ChevronUp,
  Zap, ArrowRight, ReceiptText, UserPlus,
} from 'lucide-react'
import { cn } from '../../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'user' | 'desktop' | 'cloud'
type OutcomeVariant = 'success' | 'failure'
type HelpTab = 'quick' | 'process' | 'payments' | 'yardi' | 'newowner'

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
    what: 'The purchase form has been extracted. The system is waiting for you to upload the RPTT document. This is the only ticket status in which the RPTT upload control is enabled — in every other status the field is disabled.',
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
    what: 'YARDI charges have been fetched and all automated steps are complete. The ticket is ready for your review and final validation. Bot Status will be either YARDIChargesFetched or YardiChargesUpdated at this stage.',
    action: '',
    isUserAction: true, estimatedTime: 'Your action needed',
    steps: [
      'Open the Yardi Charges tab — review the Unpaid Charges and confirm the Move flags are set correctly.',
      'Use "Auto Move Charges" to automatically match invoice payments against unpaid charges and tick Move for you. You can run it multiple times.',
      'If a charge is marked Partially Paid, its Move flag is automatically disabled — only fully outstanding charges can be moved.',
      'Go to the New Owner Ticket tab and review all the details carefully.',
      'If not done yet, click "Generate New Owner Ticket" — the PDF must be present before Validate appears.',
      'Confirm all three documents are present: Purchase Application Form, RPTT / ACRIS Document, and New Owner Ticket PDF.',
      'Click "Validate" — this cannot be undone. The ticket will lock permanently.',
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
  { icon: '🔤', title: 'Seller T-Code is required and must start with T',
    body: 'When creating a new closing ticket, Seller T-Code is a required field. The value must begin with the letter T (case-insensitive — both T and t are accepted). If the field is left blank or starts with any other character, a validation error will appear. The error clears as soon as a valid value is entered.' },
  { icon: '⚡', title: 'Auto Move Charges — let the app do the matching',
    body: 'When the ticket is in Validate Closings status, an "Auto Move Charges" button appears in the Yardi Charges tab. It automatically compares your invoice payments against unpaid YARDI charges — matching by charge type and exact amount — and ticks Move for charges that have already been paid by the buyer. Only Payable To: Building invoices are used for matching. You can run it multiple times. Partial charges are never moved.' },
  { icon: '🔂', title: 'Partially Paid charges cannot be moved',
    body: 'If an unpaid charge is marked as Partially Paid, its Move toggle is automatically disabled. Partial charges can never be transferred to the new owner. Untick Partially Paid and click Save All if you need to enable Move for that charge.' },
  { icon: '📄', title: 'Three documents required before Validate',
    body: 'The Validate button only appears when all three documents are present: Purchase Application Form, RPTT / ACRIS Document, and New Owner Ticket PDF. Bot Status must also be YARDIChargesFetched or YardiChargesUpdated.' },
  { icon: '🔒', title: 'Validation is permanent — ticket locks forever',
    body: 'Once you click Validate, the ticket becomes fully read-only. No fields, documents, or charges can be changed. Double-check everything first.' },
  { icon: '📤', title: 'RPTT upload only enabled in Ready For Post Closing',
    body: 'The RPTT Document upload control is only enabled when Ticket Status is Ready For Post Closing. In every other status the field is disabled and shows a banner explaining why — this prevents the document from being replaced once it is already being processed or validated.' },
  { icon: '↩', title: 'Deleting the RPTT rolls the ticket back',
    body: 'If the RPTT was uploaded incorrectly, delete it while the ticket is in Post Closing or Validate Closings — the ticket automatically rolls back to Ready For Post Closing. From there, upload the correct document and click Save, then click "Move to Post Closing" again. RPTT extraction and the YARDI charges fetch both run again from scratch on the new document, and once charges are refetched you will need to validate the closing again.' },
  { icon: '🎫', title: 'Generate New Owner Ticket before Validate',
    body: 'Click "Generate New Owner Ticket" in the New Owner Ticket tab first. The PDF must be generated before the Validate button appears. When you click Validate, the New Owner Ticket PDF is automatically regenerated with the latest data. Buyer and Seller SSN/EIN fields only accept 9 digits. Occupancy fields are locked to "Present" or "Absent". Empty Additional Occupant fields are saved as N/A.' },
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

      {/* Creation requirements note */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Info size={14} className="text-slate-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-slate-700 mb-1">Required fields when creating a ticket</p>
          <p className="text-[11.5px] text-slate-600 leading-relaxed">
            Unit Number, NYC Code, Package Type, and <strong>Seller T-Code</strong> are all required. Seller T-Code must start with the letter <strong>T</strong> (e.g. T12345). The field validates when you leave it and again when you click Save — a red border and short message will appear if the value is missing or invalid.
          </p>
        </div>
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
        subtitle="User fills in: Unit Number, NYC Code, Package Type, Seller T-Code"
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
          The <strong className="text-slate-700">Seller T-Code</strong> is also required when creating the ticket and must start with the letter <strong className="text-slate-700">T</strong>.
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
      <Arrow short />
      <NoteBox icon="🔒" title="Upload Restriction">
        The RPTT upload control is only enabled while Ticket Status is <strong>ReadyForPostClosing</strong>. In every other status the field is disabled, so the document cannot be swapped once it is already in Post Closing, Validate Closings, or beyond.
      </NoteBox>
      <Arrow />
      <StepCard variant="user" stage="Stage 7b" title="Move to Post Closing"
        subtitle='User clicks "Move to Post Closing" (only visible after RPTT is uploaded)'
        statuses={[{ label: 'Ticket Status', value: 'PostClosing' }, { label: 'Bot Status', value: 'RPTTUploaded (unchanged)' }]} />
      <Arrow short />
      <NoteBox icon="↩" title="Rollback Rule — RPTT uploaded by mistake">
        If the RPTT was uploaded incorrectly, <strong>delete</strong> it while the ticket is in <strong>Post Closing</strong> or <strong>Validate Closings</strong> — the ticket rolls back to <strong>ReadyForPostClosing</strong> automatically. From there: upload the correct document and Save, then click <strong>"Move to Post Closing"</strong> again. This re-triggers Stage 8 (RPTT extraction) and Stage 9 (YARDI charges fetch) from scratch on the new document, and once charges are refetched you must go through <strong>Validate Closings</strong> again before the ticket can proceed.
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
      <StepCard variant="user" stage="Stage 9b" title="Auto Move Charges (Optional)"
        subtitle='User clicks "Auto Move Charges" in the Yardi Charges tab to auto-match invoice payments to unpaid charges'
        statuses={[{ label: 'Bot Status', value: 'YardiChargesUpdated' }, { label: 'Note', value: 'Can re-run anytime' }]} />
      <Arrow short />
      <NoteBox icon="⚡" title="Auto Move Charges">
        The <strong>Auto Move Charges</strong> button is visible when Bot Status is <strong>YARDIChargesFetched</strong> or <strong>YardiChargesUpdated</strong>. It automatically matches invoice payments (Payable To: Building, exact amount) against unpaid YARDI charges and ticks the <strong>Move</strong> flag. Partial charges are never moved. You can re-run it at any time.
      </NoteBox>
      <Arrow />

      <PhaseHeader number="Phase 5" title="Business Validation" />
      <Arrow />
      <StepCard variant="user" stage="Stage 10" title="Validate Closing Information"
        subtitle='User reviews all info and clicks "Validate" in the New Owner Ticket tab'
        statuses={[{ label: 'Before', value: 'ValidateClosings' }, { label: 'Ticket Status', value: 'TransferringBuilding' }, { label: 'Bot Status', value: 'InformationValidated' }]} />
      <Arrow short />
      <NoteBox icon="✅" title="Validation Requirements">
        The Validate button appears only when <strong>all</strong> of the following are true:
        <br />• Bot Status is <strong>YARDIChargesFetched</strong> or <strong>YardiChargesUpdated</strong>
        <br />• All three documents are present: <strong>Purchase Application Form</strong>, <strong>RPTT Document</strong>, and <strong>New Owner Ticket PDF</strong>
        <br /><br />
        On clicking Validate, the New Owner Ticket PDF is automatically <strong>regenerated</strong> with the latest data.
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

// ─── Payments Tab ────────────────────────────────────────────────────────────

function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-[12px] text-blue-800 leading-relaxed">
      <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}

interface FieldGuideRow { field: string; what: string; required?: boolean }

function FieldGuideTable({ rows }: { rows: FieldGuideRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-[12px] border-collapse bg-white">
        <thead>
          <tr className="bg-[#EDE8E0]">
            <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-500 w-40">Field</th>
            <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-500">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ field, what, required }) => (
            <tr key={field} className="border-t border-slate-100">
              <td className="px-4 py-2.5 font-semibold text-[#1E3A47] align-top whitespace-nowrap">
                {field}{required && <span className="ml-1 text-red-500">*</span>}
              </td>
              <td className="px-4 py-2.5 text-slate-600 leading-relaxed">{what}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const PAYMENT_FIELDS: FieldGuideRow[] = [
  { field: 'Payment', what: 'The type of charge or fee due at closing. Choose from the dropdown — over 50 options including Flip Tax, Legal Fee, Maintenance Fees, Security Deposit, Move In/Out Fee, and more.', required: true },
  { field: 'Paid By', what: 'Who is responsible for this payment — Seller or Buyer.', required: true },
  { field: 'Amount', what: 'The dollar amount. Enter a number (e.g. 1340.70) or "TBD" if the amount is not yet confirmed.', required: true },
  { field: 'Payable To', what: 'Who receives the payment. Choose Building (the co-op/condo), AKAM Associates Inc., or Other. If Other is selected, a free-text field appears so you can specify the recipient.', required: true },
  { field: 'Cheque #', what: 'Optional. The cheque number associated with this payment, if applicable.' },
  { field: 'Applicable to Ledger', what: 'Controls whether this payment row is included when reconciling against the YARDI ledger. See details below.' },
]

function PaymentsContent() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Invoice Tab</p>
          <h3 className="text-[15px] font-bold text-slate-800">Adding Payments to an Invoice</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            In the <strong>Invoice</strong> tab, use the <em>Add Payments</em> form to create individual payment line items linked to this closing ticket. Each row represents one charge that will appear on the generated invoice.
          </p>
        </div>
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Steps</p>
          {['Open the Invoice tab on the closing ticket.','Click "Add Payment" to add extra rows if you have more than one charge.','Fill in each row: Payment type, Paid By, Amount, and Payable To are required.','Optionally enter a Cheque # and set the Applicable to Ledger flag (see below).','Click "Save Payments" when done. Rows are saved together in one batch.','Once payments are saved, use "Generate Invoice" to produce the PDF.'].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5" style={{ background: '#1E3A47' }}>{i + 1}</div>
              <p className="text-[12.5px] text-slate-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
        <FieldGuideTable rows={PAYMENT_FIELDS} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Applicable to Ledger</p>
          <h3 className="text-[15px] font-bold text-slate-800">What does "Applicable to Ledger" mean?</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">Each payment row has an <strong>Applicable to Ledger</strong> checkbox (labelled <strong>N/A</strong> in the form). This flag controls whether the payment is included in the ledger reconciliation view in the Yardi Charges tab.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide mb-1.5">✅ Checkbox not ticked (default)</p>
            <p className="text-[12px] text-emerald-800 leading-relaxed">The payment <strong>is applicable to the ledger</strong>. It will be reconciled against the YARDI Seller or Buyer ledger when you use "Check with Invoice". Standard for maintenance fees, flip tax, closing fees, etc.</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">⊘ N/A ticked</p>
            <p className="text-[12px] text-amber-800 leading-relaxed">The payment is <strong>excluded from ledger reconciliation</strong>. It will appear on the invoice but will not be matched against any YARDI ledger row. Use for AKAM Processing Fee, application fees, or one-off charges.</p>
          </div>
        </div>
        <InfoCallout>
          <strong>Which payable-to option matters for reconciliation?</strong><br />
          Only payments marked <strong>Payable To: Building</strong> and <strong>not</strong> flagged N/A are matched against YARDI ledger rows in the "Check with Invoice" view.
        </InfoCallout>
      </div>
      <p className="text-center text-[11px] text-slate-400 pt-2">Payments Guide &nbsp;·&nbsp; AKAM Associates &nbsp;·&nbsp; Closing Management System</p>
    </div>
  )
}

// ─── Yardi Charges Tab ────────────────────────────────────────────────────────

const MANUAL_CHARGE_FIELDS: FieldGuideRow[] = [
  { field: 'Charge',       what: 'The type of scheduled charge (e.g. Parking, Storage Fee, Sublet Fees, Utilities, Security Deposit).', required: true },
  { field: 'Amount',       what: 'The charge amount per posting cycle.', required: true },
  { field: 'Date From',    what: 'Optional. The start date for this charge.' },
  { field: 'Date To',      what: 'Optional. The end date for this charge.' },
  { field: 'Type',         what: 'Detail (standard posting) or No Charge (records without billing).' },
  { field: 'E-Pay Type',   what: 'Optional. EFT or Credit Card.' },
  { field: 'Rate/Sqft',    what: 'Optional. Rate per square foot if the charge is area-based.' },
  { field: 'Max Postings', what: 'Optional. Maximum number of times the charge can be posted.' },
  { field: 'Hold',         what: 'Puts the charge on hold — recorded but not posted until released.' },
  { field: 'Notes',        what: 'Optional free-text notes.' },
]

function YardiChargesContent() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Yardi Charges Tab</p>
          <h3 className="text-[15px] font-bold text-slate-800">Where do these charges come from?</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            All charges in this tab are <strong>fetched directly from YARDI</strong> by the automation bot during Stage 9 of the ticket lifecycle. They are pulled into two tables — <strong>Unpaid Charges</strong> and <strong>Scheduled Charges</strong> — along with a <strong>Seller Ledger</strong> and <strong>Buyer Ledger</strong> for reconciliation. You can update the <strong>Move</strong> and <strong>Partially Paid</strong> flags on existing rows, and add manual scheduled charges if something was missed.
          </p>
        </div>
      </div>

      {/* Auto Move Charges */}
      <div className="rounded-2xl border border-[#1E3A47] bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Auto Move Charges</p>
          <h3 className="text-[15px] font-bold text-slate-800">Automatically match invoice payments to charges</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            When the ticket is in <strong>Validate Closings</strong> status and the Bot Status is <strong>YARDIChargesFetched</strong> or <strong>YardiChargesUpdated</strong>, an <strong>"Auto Move Charges"</strong> button appears in the toolbar. Clicking it compares your invoice payments against unpaid YARDI charges and automatically ticks the <strong>Move</strong> flag for charges that have been paid.
          </p>
        </div>
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">How it works</p>
          {[
            'Only Invoice rows marked Payable To: Building are used — AKAM and Other invoices are ignored.',
            'Invoice amounts are matched exactly against YARDI charge amounts (e.g. $56.00 = $56.00).',
            'Invoice charge types are mapped to YARDI charge codes using the existing charge mapping table.',
            'If multiple unpaid charges exist for the same code and amount, the most recent month (from Notes) is consumed first.',
            'Each invoice row matches at most one unpaid charge — one-to-one matching.',
            'Partial charges are never moved, even if their amount matches.',
            'After matching, Bot Status is updated to YardiChargesUpdated.',
            'You can run Auto Move Charges multiple times — it is safe to re-run.',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5" style={{ background: '#1E3A47' }}>{i + 1}</div>
              <p className="text-[12.5px] text-slate-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
        <InfoCallout>
          <strong>Unmatched charges are left unchanged.</strong> If no invoice matches a YARDI charge, its Move flag stays as-is. No errors or warnings are shown for unmatched rows.
        </InfoCallout>
      </div>

      {/* Move flag */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Move Flag</p>
          <h3 className="text-[15px] font-bold text-slate-800">Which charges go to the new owner?</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            The <strong>Move</strong> toggle on both Unpaid Charges and Scheduled Charges indicates which charges should be transferred to the new owner's account. You can tick Move manually or use Auto Move Charges to set it automatically. Then click <strong>Save All</strong>.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide mb-1.5">Move ticked</p>
            <p className="text-[12px] text-emerald-800 leading-relaxed">This charge will be moved to the new owner's account as part of the transfer.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">Move not ticked</p>
            <p className="text-[12px] text-slate-600 leading-relaxed">The charge stays with the seller's account and is not transferred.</p>
          </div>
        </div>
        <InfoCallout>
          <strong>Move is disabled for Partially Paid charges.</strong> If an unpaid charge is flagged as Partially Paid, its Move toggle is greyed out and cannot be ticked. Untick Partially Paid and save if you need to enable Move for that charge.
        </InfoCallout>
      </div>

      {/* Partially Paid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Partially Paid Flag</p>
          <h3 className="text-[15px] font-bold text-slate-800">Marking a charge as Partially Paid</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            The <strong>Partially Paid</strong> flag on an Unpaid Charge indicates that a partial payment has been made against that charge but the full balance is not yet settled. Tick this flag to record the partial payment status, then click <strong>Save All</strong>. Validation can proceed regardless of partial charges — however, a partially paid charge's Move flag will be disabled.
          </p>
        </div>
      </div>

      {/* Manual Charges */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Manual Charges</p>
          <h3 className="text-[15px] font-bold text-slate-800">Adding a Scheduled Charge manually</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">If a charge was not picked up by the YARDI fetch, you can add it manually in the Scheduled Charges section.</p>
        </div>
        <div className="space-y-2.5">
          {['Open the Yardi Charges tab.','Scroll to the Scheduled Charges section.','Click "Add Scheduled Charge" — a form expands.','Select the Charge type and enter the Amount (both required).','Fill in optional fields as needed and click "Save Charge".','The new row appears marked with a Manual badge and can be deleted if needed.'].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5" style={{ background: '#1E3A47' }}>{i + 1}</div>
              <p className="text-[12.5px] text-slate-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
        <FieldGuideTable rows={MANUAL_CHARGE_FIELDS} />
        <InfoCallout>The system prevents duplicate charge codes — if a scheduled charge with the same code already exists, a validation error will appear. Check the existing table first.</InfoCallout>
      </div>

      {/* Ledger Reconciliation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Ledger Reconciliation</p>
          <h3 className="text-[15px] font-bold text-slate-800">Check with Invoice</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            Each ledger section has a <strong>"Check with Invoice"</strong> toggle. When enabled, invoice payment rows marked <strong>Payable To: Building</strong> and not flagged N/A are overlaid onto the ledger — highlighted in green — so you can confirm invoice payments match outstanding YARDI charges before validating.
          </p>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 pt-2">Yardi Charges Guide &nbsp;·&nbsp; AKAM Associates &nbsp;·&nbsp; Closing Management System</p>
    </div>
  )
}

// ─── New Owner Ticket Tab ─────────────────────────────────────────────────────

function NewOwnerTicketContent() {
  return (
    <div className="space-y-6">

      {/* Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">New Owner Ticket Tab</p>
          <h3 className="text-[15px] font-bold text-slate-800">How is the New Owner Ticket populated?</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            The automation populates the New Owner Ticket using two source documents. Each document is the authoritative source for a specific set of fields — they are never mixed.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-2">📄 RPTT — Real Property Transfer Tax Return</p>
            <ul className="text-[12px] text-blue-800 space-y-1 leading-relaxed list-disc list-inside">
              <li>Buyer names (legal ownership)</li>
              <li>Seller names</li>
              <li>Buyer &amp; Seller addresses</li>
              <li>Identification Numbers (SSN / EIN)</li>
            </ul>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-[11px] font-bold text-violet-700 uppercase tracking-wide mb-2">📋 PAF — Purchase Application Form</p>
            <ul className="text-[12px] text-violet-800 space-y-1 leading-relaxed list-disc list-inside">
              <li>Contact information (phone, email)</li>
              <li>Owner occupancy status</li>
              <li>Additional occupants</li>
              <li>Financial information</li>
            </ul>
          </div>
        </div>
        <InfoCallout>
          <strong>The RPTT is always the authority for Buyer and Seller names.</strong> The Purchase Application Form never overwrites names — it only provides contact, occupancy and financial details.
        </InfoCallout>
      </div>

      {/* Buyer Mapping */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Buyer Mapping</p>
          <h3 className="text-[15px] font-bold text-slate-800">How Buyers are mapped from the RPTT</h3>
        </div>
        <FieldGuideTable rows={[
          { field: 'Primary Owner', what: 'Always Buyer 1 from the RPTT. Name, Address, City, State, ZIP and Identification Number (SSN or EIN) are populated from Buyer 1.' },
          { field: 'Alternate Owner', what: 'Populated from Buyer 2 in the RPTT, if present. If Buyer 2 does not exist, the Alternate Owner section is left blank.' },
          { field: 'SSN / EIN', what: 'If the Buyer is an individual, their SSN is extracted. If the Buyer is a Trust, LLC, Estate or other legal entity, the EIN is extracted. Both are stored in the same Identification Number field — the ticket does not distinguish between them.' },
        ]} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">Individual Purchase</p>
            <p className="text-[12px] text-slate-600 leading-relaxed">Buyer 1 → Primary Owner (SSN). Buyer 2 → Alternate Owner (SSN) if present.</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">Trust / LLC / Estate</p>
            <p className="text-[12px] text-amber-800 leading-relaxed">The legal entity remains the Primary Owner (EIN). The Applicant from the PAF acts as the primary contact — Buyer 2 contact is left blank.</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Contact Information</p>
          <h3 className="text-[15px] font-bold text-slate-800">Phone &amp; Email — sourced from the PAF</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            Contact details (phone and email) come exclusively from the Purchase Application Form. The RPTT does not contain contact information.
          </p>
        </div>
        <FieldGuideTable rows={[
          { field: 'Individual', what: 'Applicant contact → Primary Owner. Co-Applicant contact → Alternate Owner.' },
          { field: 'Trust / LLC / Estate', what: 'Applicant contact → Buyer 1 (legal entity). Buyer 2 contact is left blank. The trustee or authorised signer is the Applicant.' },
        ]} />
      </div>

      {/* Owner Occupancy */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Owner Occupancy</p>
          <h3 className="text-[15px] font-bold text-slate-800">Present or Absent — determined from the PAF</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            Occupancy status is determined solely from the Occupants section of the Purchase Application Form. The RPTT is not used for this.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-[12px] border-collapse bg-white">
            <thead><tr className="bg-[#EDE8E0]">
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-500 w-36">Purchase Type</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-500">Rule</th>
            </tr></thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2.5 font-semibold text-[#1E3A47] align-top">Individual</td>
                <td className="px-4 py-2.5 text-slate-600 leading-relaxed">If Purchaser 1 appears in the Occupants list → Primary Owner = <strong>Present</strong>. Otherwise → <strong>Absent</strong>. Same logic applies to Purchaser 2 / Alternate Owner.</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2.5 font-semibold text-[#1E3A47] align-top">Trust / LLC / Estate</td>
                <td className="px-4 py-2.5 text-slate-600 leading-relaxed">Purchaser 2 is the Applicant (trustee / signer). If the Applicant appears in Occupants → both Primary and Alternate Owner = <strong>Present</strong>. Otherwise → both = <strong>Absent</strong>.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <InfoCallout>
          In the app, the Occupancy field only accepts <strong>Present</strong> or <strong>Absent</strong>. You cannot type free text into this field — use the dropdown.
        </InfoCallout>
      </div>

      {/* Additional Occupants */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Additional Occupants</p>
          <h3 className="text-[15px] font-bold text-slate-800">Who is added as an Additional Occupant?</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            Additional Occupants are taken from the Occupants section of the Purchase Application Form, after removing the buyers themselves.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">Individual — remove</p>
            <p className="text-[12px] text-slate-600 leading-relaxed">Purchaser 1 and Purchaser 2 are removed from the occupants list before creating Additional Occupant records.</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">Trust / LLC / Estate — remove</p>
            <p className="text-[12px] text-amber-800 leading-relaxed">Only Purchaser 2 (the Applicant) is removed. The Trust / LLC / Estate is not an occupant, so it is not removed.</p>
          </div>
        </div>
        <FieldGuideTable rows={[
          { field: 'Age requirement', what: 'Only occupants aged 18 or older are added. Occupants younger than 18 or with a missing age are ignored.' },
          { field: 'Order', what: 'Occupants are added in the same order as they appear on the Purchase Application Form.' },
          { field: 'Relationship', what: 'All additional occupants are created with Relationship = Other. The automation does not attempt to determine family relationships.' },
          { field: 'Empty fields', what: 'If an Additional Occupant field is left empty when you save, the app automatically stores it as N/A.' },
        ]} />
      </div>

      {/* Seller Mapping */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Seller Mapping</p>
          <h3 className="text-[15px] font-bold text-slate-800">Sellers are sourced entirely from the RPTT</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            Seller names are always taken from the RPTT (Grantor 1 and Grantor 2). The Purchase Application Form is never used to overwrite seller names.
          </p>
        </div>
        <FieldGuideTable rows={[
          { field: 'Seller 1', what: 'Mapped from Grantor 1 in the RPTT.' },
          { field: 'Seller 2', what: 'Mapped from Grantor 2 in the RPTT, if present.' },
          { field: 'Seller Phone / Email', what: 'These contact fields are the only Seller information sourced from the Purchase Application Form.' },
        ]} />
      </div>

      {/* Financial Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Financial Information</p>
          <h3 className="text-[15px] font-bold text-slate-800">Extracted from the Purchase Application Form</h3>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
            All financial fields in the New Owner Ticket are sourced exclusively from the Purchase Application Form.
          </p>
        </div>
        <FieldGuideTable rows={[
          { field: 'Purchase Price', what: 'From the PAF.' },
          { field: 'Maintenance / Common Charges', what: 'From the PAF.' },
          { field: 'Deposit Amount', what: 'From the PAF.' },
          { field: 'Amount Financed', what: 'From the PAF.' },
          { field: 'Mortgage Lender', what: 'From the PAF.' },
          { field: 'Shares', what: 'From the PAF.' },
        ]} />
      </div>

      {/* SSN/EIN field rules */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">App Field Rules</p>
          <h3 className="text-[15px] font-bold text-slate-800">Input constraints in the New Owner Ticket form</h3>
        </div>
        <FieldGuideTable rows={[
          { field: 'Buyer 1 SSN/EIN', what: '9 digits only. Letters are rejected with an inline warning. No formatting is applied — store the raw 9-digit number.' },
          { field: 'Buyer 2 SSN/EIN', what: 'Same as Buyer 1 — 9 digits, numbers only.' },
          { field: 'Buyer 1 Occupancy', what: 'Dropdown — select Present or Absent only. Defaults to Present.' },
          { field: 'Buyer 2 Occupancy', what: 'Dropdown — select Present or Absent only. Defaults to Present.' },
          { field: 'Additional Occupants', what: 'Free text. If left empty when saving, the value is automatically replaced with N/A.' },
        ]} />
      </div>

      {/* Summary table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1">Summary</p>
          <h3 className="text-[15px] font-bold text-slate-800">Source of truth at a glance</h3>
        </div>
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-[12px] border-collapse bg-white">
            <thead><tr className="bg-[#EDE8E0]">
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-500">Data</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-500">Source</th>
            </tr></thead>
            <tbody>
              {[
                ['Buyer names', 'RPTT'],
                ['Seller names', 'RPTT'],
                ['Buyer / Seller addresses', 'RPTT'],
                ['Identification Numbers (SSN / EIN)', 'RPTT'],
                ['Contact information (phone, email)', 'Purchase Application Form'],
                ['Owner Occupancy', 'Purchase Application Form'],
                ['Additional Occupants', 'Purchase Application Form'],
                ['Financial information', 'Purchase Application Form'],
              ].map(([data, source]) => (
                <tr key={data} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-semibold text-[#1E3A47]">{data}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${source === 'RPTT' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                      {source === 'RPTT' ? '📄' : '📋'} {source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 pt-2">
        New Owner Ticket Guide &nbsp;·&nbsp; AKAM Associates &nbsp;·&nbsp; Closing Management System
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
    { key: 'quick',    icon: <ClipboardCheck size={13} />, label: 'Quick Reference',  sub: 'What do I do?' },
    { key: 'process',  icon: <Zap size={13} />,            label: 'Process Overview', sub: 'Full automation flow' },
    { key: 'payments', icon: <ReceiptText size={13} />,    label: 'Payments',         sub: 'Invoice & ledger guide' },
    { key: 'yardi',    icon: <BadgeCheck size={13} />,     label: 'Yardi Charges',    sub: 'Charges, Move & Partial' },
    { key: 'newowner', icon: <UserPlus size={13} />,       label: 'New Owner Ticket', sub: 'Buyers, Sellers & Occupancy' },
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
          {activeTab === 'quick'    && <QuickReferenceContent />}
          {activeTab === 'process'  && <><Legend /><FlowchartContent /></>}
          {activeTab === 'payments' && <PaymentsContent />}
          {activeTab === 'yardi'    && <YardiChargesContent />}
          {activeTab === 'newowner' && <NewOwnerTicketContent />}
        </div>
      </div>
    </div>
  )
}
