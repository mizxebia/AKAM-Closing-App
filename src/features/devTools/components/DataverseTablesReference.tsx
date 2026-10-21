import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Download, Search, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet'
import {
  DATAVERSE_TABLES,
  PROCESS_STAGES,
  type DataverseTableDoc,
} from '../data/dataverseTables'
import { downloadDataverseTablesPdf } from '../utils/dataverseTablesPdf'

type View = 'tables' | 'process'

interface DataverseTablesReferenceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GROUP_BADGE: Record<DataverseTableDoc['group'], string> = {
  'Core ticket': 'bg-sky-100 text-sky-700',
  'Charges & ledgers': 'bg-amber-100 text-amber-700',
  Platform: 'bg-slate-100 text-slate-700',
}

const TABLE_BY_ID = new Map(DATAVERSE_TABLES.map((t) => [t.id, t]))

function matchesQuery(table: DataverseTableDoc, query: string) {
  if (!query) return true
  const haystack = [
    table.displayName,
    table.logicalName,
    table.entitySet,
    table.generatedService,
    table.purpose,
    ...table.keyColumns.map((c) => c.name),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
        {title}
      </h4>
      {children}
    </div>
  )
}

function TableCard({
  table,
  expanded,
  onToggle,
}: {
  table: DataverseTableDoc
  expanded: boolean
  onToggle: () => void
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight

  return (
    <div className="rounded-xl border border-[#D5CBB8] bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-start gap-2 px-4 py-3 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <Chevron className="mt-0.5 size-4 shrink-0 text-[#1E3A47]" />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#1E3A47]">
              {table.displayName}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${GROUP_BADGE[table.group]}`}
            >
              {table.group}
            </span>
          </span>
          <code className="truncate text-xs text-[#64748b]">
            {table.logicalName}
          </code>
          <span className="text-xs text-[#475569]">{table.purpose}</span>
        </span>
      </button>

      {expanded && (
        <div className="grid gap-4 border-t border-[#EDE8E0] px-4 py-3 text-xs text-[#334155]">
          <Section title="Identity">
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1">
              <dt className="text-[#94a3b8]">Entity set</dt>
              <dd><code>{table.entitySet}</code></dd>
              <dt className="text-[#94a3b8]">Service</dt>
              <dd><code>{table.generatedService}</code></dd>
              <dt className="text-[#94a3b8]">Wrapper file</dt>
              <dd><code>{table.serviceFile}</code></dd>
              <dt className="text-[#94a3b8]">Linked by</dt>
              <dd>{table.linkedBy}</dd>
              <dt className="text-[#94a3b8]">Audit logged</dt>
              <dd>{table.auditLogged ? 'Yes — writes call writeChangeLog()' : 'No'}</dd>
            </dl>
          </Section>

          <Section title="Who reads / writes it">
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1">
              <dt className="text-[#94a3b8]">App reads</dt>
              <dd>{table.access.appReads}</dd>
              <dt className="text-[#94a3b8]">App writes</dt>
              <dd>{table.access.appWrites}</dd>
              <dt className="text-[#94a3b8]">Automation</dt>
              <dd>{table.access.automationWrites}</dd>
            </dl>
          </Section>

          <Section title="Key columns">
            <ul className="grid gap-1">
              {table.keyColumns.map((col) => (
                <li key={col.name}>
                  <code className="font-semibold text-[#1E3A47]">{col.name}</code>
                  {' — '}
                  {col.note}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="How it is used in the process">
            <ul className="grid gap-1">
              {table.usage.map((u) => (
                <li key={u.where}>
                  <span className="font-semibold text-[#1E3A47]">{u.where}:</span>{' '}
                  {u.how}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="TDD / PDD notes">
            <ul className="list-disc pl-4">
              {table.testingNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  )
}

export function DataverseTablesReference({
  open,
  onOpenChange,
}: DataverseTablesReferenceProps) {
  const [view, setView] = useState<View>('tables')
  const [query, setQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  async function handleDownload() {
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadDataverseTablesPdf()
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Unable to generate the PDF.'
      )
    } finally {
      setDownloading(false)
    }
  }

  const normalizedQuery = query.trim().toLowerCase()
  const visibleTables = useMemo(
    () => DATAVERSE_TABLES.filter((t) => matchesQuery(t, normalizedQuery)),
    [normalizedQuery]
  )

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openTable(id: string) {
    setQuery('')
    setView('tables')
    setExpandedIds((prev) => new Set(prev).add(id))
  }

  const tabClass = (active: boolean) =>
    `h-8 rounded-lg px-3 text-xs font-semibold uppercase tracking-[0.08em] transition ${
      active
        ? 'bg-[#1E3A47] text-[#F5F2EC]'
        : 'border border-[#D5CBB8] bg-white text-[#1E3A47] hover:bg-[#F5F2EC]'
    }`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="invoice-viewer-sheet w-full sm:max-w-3xl">
        <SheetHeader className="invoice-viewer-sheet-header">
          <div>
            <SheetDescription className="text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
              Developer Mode
            </SheetDescription>
            <SheetTitle
              className="mt-1 text-xl font-semibold text-[#1E3A47]"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}
            >
              Dataverse Tables Reference
            </SheetTitle>
          </div>
          <button
            type="button"
            className="invoice-viewer-close-btn"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 py-4">
          <p className="text-xs text-[#475569]">
            What each table stores, who reads and writes it, and how it is used across
            the closing process. Use it to plan tests and process changes (TDD / PDD).
            Full detail lives in <code>docs/DEVELOPER_GUIDE.md</code> §5.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={tabClass(view === 'tables')} onClick={() => setView('tables')}>
              Tables ({DATAVERSE_TABLES.length})
            </button>
            <button type="button" className={tabClass(view === 'process')} onClick={() => setView('process')}>
              Process map
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#C9A96E] bg-[#C9A96E] px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void handleDownload()}
              disabled={downloading}
              title="Download all tables and the process map as a PDF"
            >
              <Download className="size-3.5" />
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>

            {view === 'tables' && (
              <>
                <label className="relative ml-auto">
                  <Search className="pointer-events-none absolute left-2 top-2.5 size-4 text-[#94a3b8]" />
                  <input
                    className="h-9 w-56 rounded-md border border-[#e2e8f0] pl-8 pr-2 text-sm"
                    placeholder="Search table or column"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#1E3A47] underline"
                  onClick={() =>
                    setExpandedIds(
                      expandedIds.size === visibleTables.length
                        ? new Set()
                        : new Set(visibleTables.map((t) => t.id))
                    )
                  }
                >
                  {expandedIds.size === visibleTables.length ? 'Collapse all' : 'Expand all'}
                </button>
              </>
            )}
          </div>

          {downloadError && (
            <p className="text-xs text-red-600">{downloadError}</p>
          )}

          {view === 'tables' ? (
            <div className="grid gap-2">
              {visibleTables.length === 0 && (
                <p className="text-sm text-[#64748b]">No tables match “{query}”.</p>
              )}
              {visibleTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  expanded={expandedIds.has(table.id)}
                  onToggle={() => toggle(table.id)}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {PROCESS_STAGES.map((stage) => (
                <div
                  key={stage.stage}
                  className="rounded-xl border border-[#D5CBB8] bg-white px-4 py-3 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-[#1E3A47]">{stage.stage}</h3>
                  <p className="mb-2 text-xs text-[#64748b]">{stage.trigger}</p>
                  <ul className="grid gap-1 text-xs text-[#334155]">
                    {stage.tablesTouched.map((touch) => {
                      const table = TABLE_BY_ID.get(touch.tableId)
                      return (
                        <li key={`${stage.stage}-${touch.tableId}`}>
                          <button
                            type="button"
                            className="font-semibold text-[#1E3A47] underline"
                            onClick={() => openTable(touch.tableId)}
                          >
                            {table?.displayName ?? touch.tableId}
                          </button>
                          {' — '}
                          {touch.effect}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
