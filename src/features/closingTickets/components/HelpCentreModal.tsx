import { X, BookOpen } from 'lucide-react'
import { cn } from '../../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'user' | 'desktop' | 'cloud'
type OutcomeVariant = 'success' | 'failure'

interface StatusEntry {
  label: string
  value: string
}

interface StepCardProps {
  variant: BadgeVariant
  stage: string
  title: string
  subtitle: string
  statuses: StatusEntry[]
}

interface OutcomeProps {
  variant: OutcomeVariant
  statuses: StatusEntry[]
}

interface DecisionRowProps {
  success: StatusEntry[]
  failure: StatusEntry[]
}

interface NoteBoxProps {
  icon: string
  title: string
  children: React.ReactNode
}

interface PhaseHeaderProps {
  number: string
  title: string
}

// ─── Palette constants ────────────────────────────────────────────────────────

const BADGE: Record<BadgeVariant, { bar: string; badge: string; border: string }> = {
  user:    { bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-800',   border: 'border-blue-400' },
  desktop: { bar: 'bg-green-600',  badge: 'bg-green-100 text-green-800', border: 'border-green-500' },
  cloud:   { bar: 'bg-violet-600', badge: 'bg-violet-100 text-violet-800', border: 'border-violet-500' },
}

const BADGE_LABEL: Record<BadgeVariant, string> = {
  user:    'User Action',
  desktop: 'Desktop Automation',
  cloud:   'Cloud Automation',
}

// ─── Small primitives ─────────────────────────────────────────────────────────

function Arrow({ short = false }: { short?: boolean }) {
  return (
    <div className="flex flex-col items-center" style={{ height: short ? 20 : 28 }}>
      <div className="w-px flex-1 bg-slate-300" />
      <div
        style={{
          width: 0, height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '7px solid #CBD5E1',
        }}
      />
    </div>
  )
}

function PhaseHeader({ number, title }: PhaseHeaderProps) {
  return (
    <div className="flex items-center gap-3 w-full rounded-xl px-5 py-3"
      style={{ background: '#1E3A47' }}>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-white whitespace-nowrap">
        {number}
      </span>
      <span className="text-[15px] font-bold text-white tracking-tight">{title}</span>
    </div>
  )
}

function StatusPanel({ statuses }: { statuses: StatusEntry[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 min-w-[190px] shrink-0">
      {statuses.map(({ label, value }) => (
        <div key={label} className="flex items-baseline gap-2 leading-relaxed">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 whitespace-nowrap">
            {label}
          </span>
          <span className="text-[11px] font-semibold text-slate-700">{value}</span>
        </div>
      ))}
    </div>
  )
}

function StepCard({ variant, stage, title, subtitle, statuses }: StepCardProps) {
  const c = BADGE[variant]
  return (
    <div className={cn(
      'relative flex gap-3 w-full rounded-xl border-[1.5px] bg-white px-5 py-4 pl-6',
      c.border,
    )}>
      {/* accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-[5px] rounded-l-xl', c.bar)} />
      <div className="flex-1 min-w-0">
        <span className={cn('inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1', c.badge)}>
          {BADGE_LABEL[variant]}
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{stage}</p>
        <p className="text-[15px] font-bold text-slate-900 leading-snug mt-0.5">{title}</p>
        <p className="text-[11px] text-slate-500 italic mt-0.5">{subtitle}</p>
      </div>
      <StatusPanel statuses={statuses} />
    </div>
  )
}

function Outcome({ variant, statuses }: OutcomeProps) {
  const isSuccess = variant === 'success'
  return (
    <div className={cn(
      'flex-1 rounded-xl border-[1.5px] px-4 py-3 text-[11px]',
      isSuccess ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50',
    )}>
      <div className={cn(
        'flex items-center gap-2 font-bold mb-2',
        isSuccess ? 'text-green-700' : 'text-red-600',
      )}>
        <div className={cn(
          'flex size-4 items-center justify-center rounded-full text-white text-[9px] font-black shrink-0',
          isSuccess ? 'bg-green-600' : 'bg-red-500',
        )}>
          {isSuccess ? '✓' : '✕'}
        </div>
        {isSuccess ? 'Success' : 'Failure'}
      </div>
      {statuses.map(({ label, value }) => (
        <div key={label} className="leading-[1.75]">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label} </span>
          <span className="font-semibold text-slate-700">{value}</span>
        </div>
      ))}
    </div>
  )
}

function DecisionRow({ success, failure }: DecisionRowProps) {
  return (
    <div className="flex items-start gap-4 w-full">
      {/* diamond */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div
          className="flex items-center justify-center rounded-md bg-amber-400"
          style={{ width: 56, height: 56, transform: 'rotate(45deg)' }}
        >
          <span
            className="text-[9px] font-black uppercase tracking-wide text-white"
            style={{ transform: 'rotate(-45deg)', lineHeight: 1.2, textAlign: 'center' }}
          >
            Result
          </span>
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
    <div className="w-full rounded-xl border-[1.5px] border-dashed border-slate-400 bg-slate-50 px-4 py-3 text-[11.5px] text-slate-600 leading-relaxed">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{icon} {title}</p>
      {children}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { color: '#3B82F6', label: 'User Action' },
    { color: '#16A34A', label: 'Desktop Automation' },
    { color: '#7C3AED', label: 'Cloud Automation' },
    { color: '#F59E0B', label: 'Decision / Status' },
    { color: '#DC2626', label: 'Failure Path' },
    { color: '#9CA3AF', label: 'Note / Remark', dashed: true },
  ]
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white px-5 py-3 mb-6">
      <p className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Legend</p>
      {items.map(({ color, label, dashed }) => (
        <div key={label} className="flex items-center gap-2 text-[12px] text-slate-600">
          <div
            className="size-3 rounded-sm shrink-0"
            style={{
              background: color,
              border: dashed ? '1.5px dashed #6B7280' : undefined,
            }}
          />
          {label}
        </div>
      ))}
    </div>
  )
}

// ─── Summary tables ───────────────────────────────────────────────────────────

function SummaryTables() {
  const statusRows = [
    { status: 'Draft',                color: '#6B7280', desc: 'Ticket created, awaiting automation' },
    { status: 'Processing',           color: '#3B82F6', desc: 'Seller info & purchase form retrieval' },
    { status: 'ReadyForPostClosing',  color: '#8B5CF6', desc: 'Purchase form extracted, RPTT needed' },
    { status: 'PostClosing',          color: '#0EA5E9', desc: 'RPTT uploaded, extraction in progress' },
    { status: 'ValidateClosings',     color: '#F59E0B', desc: 'All data ready, awaiting user validation' },
    { status: 'TransferringBuilding', color: '#1E3A47', desc: 'Validated, ownership transfer underway' },
    { status: 'Completed',            color: '#059669', desc: 'New owner created in YARDI — done' },
    { status: 'Failed',               color: '#DC2626', desc: 'An automation step encountered an error' },
  ]
  const legendRows = [
    { color: '#3B82F6', label: 'Blue',   desc: 'User Action — performed manually in the app' },
    { color: '#16A34A', label: 'Green',  desc: 'Desktop Automation — Power Automate Desktop' },
    { color: '#7C3AED', label: 'Purple', desc: 'Cloud Automation — Power Automate Cloud Flow' },
    { color: '#F59E0B', label: 'Orange', desc: 'Decision Point — Success or Failure branch' },
    { color: '#DC2626', label: 'Red',    desc: 'Failure Path — ticket enters Failed status' },
    { color: '#9CA3AF', label: 'Grey',   desc: 'Note or remark — additional context' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2">
      {/* Table 1 */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white" style={{ background: '#1E3A47' }}>
          Ticket Status Progression
        </div>
        <table className="w-full text-[12px] border-collapse">
          <tbody>
            {statusRows.map(({ status, color, desc }) => (
              <tr key={status} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-semibold text-slate-800 whitespace-nowrap">
                  <span className="inline-block size-2.5 rounded-full mr-2 align-middle" style={{ background: color }} />
                  {status}
                </td>
                <td className="px-4 py-2 text-slate-500">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table 2 */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white" style={{ background: '#1E3A47' }}>
          Automation Legend
        </div>
        <table className="w-full text-[12px] border-collapse">
          <tbody>
            {legendRows.map(({ color, label, desc }) => (
              <tr key={label} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-semibold text-slate-800 whitespace-nowrap">
                  <span className="inline-block size-2.5 rounded-sm mr-2 align-middle" style={{ background: color }} />
                  {label}
                </td>
                <td className="px-4 py-2 text-slate-500">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main flowchart content ───────────────────────────────────────────────────

function FlowchartContent() {
  return (
    <div className="flex flex-col items-center gap-0 max-w-3xl mx-auto">

      {/* ── PHASE 1 ── */}
      <PhaseHeader number="Phase 1" title="Ticket Creation" />
      <Arrow />
      <StepCard
        variant="user" stage="Stage 1" title="Create Closing Ticket"
        subtitle="User fills in: Building Code, Unit Number, Package Type"
        statuses={[{ label: 'Ticket Status', value: 'Draft' }, { label: 'Bot Status', value: 'Draft' }]}
      />
      <Arrow />

      {/* ── PHASE 2 ── */}
      <PhaseHeader number="Phase 2" title="Seller Information Collection" />
      <Arrow />
      <StepCard
        variant="desktop" stage="Stage 2" title="Retrieve Seller Information"
        subtitle="Desktop Flow: NSC Yardi Seller Details"
        statuses={[{ label: 'Trigger', value: 'Bot Status = Draft' }]}
      />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'Processing' }, { label: 'Bot Status', value: 'SellerInfoRetrieved' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedSellerInfoRetrieval' }]}
      />
      <Arrow />
      <StepCard
        variant="cloud" stage="Stage 3" title="Retrieve Domecile Information"
        subtitle="Cloud Flow: NSC_DOMECILE_DUMP"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 2 success' }]}
      />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'Processing' }, { label: 'Bot Status', value: 'DomecileDumpRetrieved' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedDomecileDumpRetrieval' }]}
      />
      <Arrow />
      <StepCard
        variant="desktop" stage="Stage 4" title="Download Purchase Application Form"
        subtitle="Desktop Flow: NSC Purchase Application Form Download"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 3 success' }]}
      />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'Processing' }, { label: 'Bot Status', value: 'FormDownloaded' }]}
        failure={[{ label: 'Ticket Status', value: 'Processing' }, { label: 'Bot Status', value: 'FailedFormDownload' }]}
      />
      <Arrow short />
      <NoteBox icon="📌" title="Note">
        The ticket remains in <strong>Processing</strong> on form download failure because the download step can be automatically retried without manual intervention.
      </NoteBox>
      <Arrow />
      <StepCard
        variant="cloud" stage="Stage 5" title="Upload Purchase Form to Document Storage"
        subtitle="Cloud Flow: NSC_PurchaseFormUpload"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 4 success' }]}
      />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'Processing' }, { label: 'Bot Status', value: 'PurchaseFormUploadOnedrive' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedPurchaseFormUploadOnedrive' }]}
      />
      <Arrow />
      <StepCard
        variant="cloud" stage="Stage 6" title="Extract Purchase Form Information"
        subtitle="Cloud Flow: NSC_PurchaseApplication_DataExtraction"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 5 success' }]}
      />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'ReadyForPostClosing' }, { label: 'Bot Status', value: 'PurchaseFormDataExtracted' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedPurchaseFormDataExtraction' }]}
      />
      <Arrow />

      {/* ── PHASE 3 ── */}
      <PhaseHeader number="Phase 3" title="Post-Closing Preparation" />
      <Arrow />
      <StepCard
        variant="user" stage="Stage 7a" title="Upload RPTT / ACRIS Document"
        subtitle="User attaches the RPTT document in the Closing Details form and clicks Save"
        statuses={[{ label: 'Ticket Status', value: 'ReadyForPostClosing' }, { label: 'Bot Status', value: 'RPTTUploaded' }]}
      />
      <Arrow />
      <StepCard
        variant="user" stage="Stage 7b" title="Move to Post Closing"
        subtitle='User clicks "Move to Post Closing" (only visible after RPTT is uploaded)'
        statuses={[{ label: 'Ticket Status', value: 'PostClosing' }, { label: 'Bot Status', value: 'RPTTUploaded (unchanged)' }]}
      />
      <Arrow short />
      <NoteBox icon="↩" title="Rollback Rule">
        If the RPTT document is <strong>deleted</strong> while the ticket is in <strong>Post Closing</strong> or <strong>Validate Closings</strong>, the system automatically rolls back to <strong>ReadyForPostClosing</strong>. If deleted from Validate Closings, the Bot Status also resets to <strong>PurchaseFormDataExtracted</strong>.
      </NoteBox>
      <Arrow />

      {/* ── PHASE 4 ── */}
      <PhaseHeader number="Phase 4" title="Validation Preparation" />
      <Arrow />
      <StepCard
        variant="cloud" stage="Stage 8" title="Extract RPTT Document Information"
        subtitle="Cloud Flow: NSC_RPTT_DataExtraction"
        statuses={[{ label: 'Trigger', value: 'Bot Status = RPTTUploaded' }]}
      />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'ValidateClosings' }, { label: 'Bot Status', value: 'RPTTExtracted' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedRPTTExtraction' }]}
      />
      <Arrow />
      <StepCard
        variant="desktop" stage="Stage 9" title="Retrieve YARDI Charges"
        subtitle="Desktop Flow: NSC Fetch YARDI Charges"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 8 success' }]}
      />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'ValidateClosings' }, { label: 'Bot Status', value: 'YARDIChargesFetched' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: '—' }]}
      />
      <Arrow />

      {/* ── PHASE 5 ── */}
      <PhaseHeader number="Phase 5" title="Business Validation" />
      <Arrow />
      <StepCard
        variant="user" stage="Stage 10" title="Validate Closing Information"
        subtitle='User reviews all information and clicks "Validate" in the New Owner Ticket tab'
        statuses={[{ label: 'Before', value: 'ValidateClosings' }, { label: 'Ticket Status', value: 'TransferringBuilding' }, { label: 'Bot Status', value: 'InformationValidated' }]}
      />
      <Arrow short />
      <NoteBox icon="✅" title="Validation Requirements">
        The Validate button is only visible when <strong>all three</strong> documents are present:{' '}
        <strong>Purchase Application Form</strong>, <strong>RPTT Document</strong>, and{' '}
        <strong>New Owner Ticket PDF</strong>.
        <br /><br />
        <strong>🔒 Read-Only Lock —</strong> Once validated, the entire ticket becomes read-only. Documents, charges, and ticket information can no longer be modified.
      </NoteBox>
      <Arrow />

      {/* ── PHASE 6 ── */}
      <PhaseHeader number="Phase 6" title="Ownership Transfer" />
      <Arrow />
      <StepCard
        variant="desktop" stage="Stage 11" title="Update Seller Information in YARDI"
        subtitle="Desktop Flow: NSC Yardi Seller Update"
        statuses={[{ label: 'Trigger', value: 'Bot Status = InformationValidated' }]}
      />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'TransferringBuilding' }, { label: 'Bot Status', value: 'SellerDetailsUpdated' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedSellerInfoRetrieval' }]}
      />
      <Arrow />
      <StepCard
        variant="desktop" stage="Stage 12" title="Create New Owner in YARDI"
        subtitle="Desktop Flow: NSC Yardi Create New Owner"
        statuses={[{ label: 'Trigger', value: 'Follows Stage 11 success' }]}
      />
      <Arrow short />
      <DecisionRow
        success={[{ label: 'Ticket Status', value: 'Completed' }, { label: 'Bot Status', value: 'OwnerRecordCreated' }]}
        failure={[{ label: 'Ticket Status', value: 'Failed' }, { label: 'Bot Status', value: 'FailedCreateNewOwner' }]}
      />
      <Arrow short />

      {/* Terminal */}
      <div className="w-full rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[17px] font-bold text-emerald-800">🎉 Process Completed</p>
          <p className="text-[12px] text-emerald-700 mt-0.5">The property ownership transfer is finalised in YARDI.</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[11px] shrink-0">
          <div className="leading-relaxed"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ticket Status </span><span className="font-semibold text-emerald-800">Completed</span></div>
          <div className="leading-relaxed"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Bot Status </span><span className="font-semibold text-emerald-800">OwnerRecordCreated</span></div>
        </div>
      </div>

      <SummaryTables />

      <p className="mt-8 text-center text-[11px] text-slate-400">
        New Sales Closure Lifecycle &nbsp;·&nbsp; AKAM Associates &nbsp;·&nbsp; Closing Management System
      </p>
    </div>
  )
}

// ─── Public modal component ───────────────────────────────────────────────────

interface HelpCentreModalProps {
  open: boolean
  onClose: () => void
}

export function HelpCentreModal({ open, onClose }: HelpCentreModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative my-8 w-full max-w-4xl rounded-2xl bg-[#F4F6F9] shadow-2xl"
        style={{ margin: '32px auto' }}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl px-6 py-4"
          style={{ background: '#1E3A47' }}
        >
          <div className="flex items-center gap-3">
            <BookOpen size={18} className="text-[#C9A96E]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] opacity-80">
                Help Centre
              </p>
              <h2
                className="text-[17px] font-bold text-white leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic' }}
              >
                New Sales Closure — Process Lifecycle
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
            aria-label="Close Help Centre"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6">
          <Legend />
          <FlowchartContent />
        </div>
      </div>
    </div>
  )
}
