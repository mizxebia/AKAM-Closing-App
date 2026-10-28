import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  RefreshCw,
  BookOpen,
  X,
  ScrollText,
  ListChecks,
  FilePlus2,
  Database,
  PieChart,
} from 'lucide-react'
import akamLogo from '../../../assets/akam_logo.png'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { LoadingScreen } from '../../../components/feedback/LoadingScreen'
import {
  EmptyState,
  PageHeader,
} from '../../../components/enterprise'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet'
import {
  botStatusColumn,
  closingTicketColumns,
  failureReasonColumn,
} from '../constants/closingTicketColumns'
import { useClosingTicketFilters } from '../hooks/useClosingTicketFilters'
import { getTicketIdsWithScheduledCharges } from '../../charges/api/chargesService'
import { useClosingTickets } from '../hooks/useClosingTickets'
import { findTicketsNeedingAutoArchive } from '../utils/closingTicketArchiving'
import { updateClosingTicket } from '../api/closingTicketsService'
import {
  writeActionLog,
  logAppFailure,
} from '../../auditLog/api/auditLogService'
import { ClosingTicketDashboard } from './ClosingTicketDashboard'
import { UserActivityPanel } from './UserActivityPanel'
import { ClosingTicketFilters } from './ClosingTicketFilters'
import { ClosingTicketTable } from './ClosingTicketTable'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { CreateClosingTicketForm } from './CreateClosingTicketForm'
import { ClosingTicketDetailsPage } from './ClosingTicketDetailsPage'
import { HelpCentreModal } from './HelpCentreModal'
import {
  useDeveloperMode,
  DeveloperModeToggle,
  DeveloperModePasswordPrompt,
} from '../../devScreenshots'
import {
  AppLogsViewer,
  DataverseTablesReference,
  BulkStatusChangeScreen,
  BulkCreateClosingsScreen,
} from '../../devTools'

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function TopNav({ userName, onHelp }: { userName: string | null; onHelp: () => void }) {
  const initials = getInitials(userName)
  return (
    <nav
      className="sticky top-0 z-30 flex items-center justify-between px-6"
      style={{ backgroundColor: '#1E3A47', height: '48px' }}
    >
      {/* Left: logo + product name */}
      <div className="flex items-center gap-3">
        <img
          src={akamLogo}
          alt="AKAM"
          style={{ height: '32px', width: '32px', borderRadius: '6px', objectFit: 'cover' }}
        />
        <span
          style={{
            color: '#C9A96E',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderLeft: '1px solid rgba(201,169,110,0.35)',
            paddingLeft: '12px',
          }}
        >
          Closing Suite
        </span>
      </div>

      {/* Right: Help Center + avatar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onHelp}
          className="flex items-center gap-1.5 transition"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'rgba(245,242,236,0.7)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#C9A96E')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,242,236,0.7)')}
          title="Open Process Lifecycle Guide"
        >
          <BookOpen size={14} />
          Help Center
        </button>
        <div
          className="grid shrink-0 place-items-center font-semibold"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#C9A96E',
            color: '#1E3A47',
            fontSize: '12px',
            letterSpacing: '0.03em',
          }}
          title={userName ?? undefined}
        >
          {initials}
        </div>
      </div>
    </nav>
  )
}

export function ClosingTicketPage() {
  const [createFormOpen, setCreateFormOpen] =
    useState(false)
  const [createSuccessMessage, setCreateSuccessMessage] =
    useState<string | null>(null)
  const [selectedRecordId, setSelectedRecordId] =
    useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [logsViewerOpen, setLogsViewerOpen] = useState(false)
  const [tablesReferenceOpen, setTablesReferenceOpen] = useState(false)
  const [bulkStatusScreenOpen, setBulkStatusScreenOpen] =
    useState(false)
  const [bulkCreateScreenOpen, setBulkCreateScreenOpen] =
    useState(false)
  const [userActivityOpen, setUserActivityOpen] = useState(false)
  const developerMode = useDeveloperMode()

  const {
    records,
    loading,
    error,
    refresh,
  } = useClosingTickets()

  const { userName, userId } = useCurrentUser()

  // Yardi charges live in a separate Dataverse table, not on the closing
  // ticket record itself, so the developer-mode "Yardi Charges" dashboard
  // filter needs this bulk ticket-id lookup loaded once — only fetched
  // when Developer Mode is actually on, since regular users never see
  // the filter that needs it.
  const [ticketIdsWithCharges, setTicketIdsWithCharges] =
    useState<Set<string>>(new Set())
  useEffect(() => {
    if (!developerMode.enabled) return
    let isMounted = true
    void getTicketIdsWithScheduledCharges()
      .then((ids) => {
        if (isMounted) setTicketIdsWithCharges(ids)
      })
      .catch(() => {
        // Filter degrades to "no matches" rather than blocking the dashboard.
      })
    return () => {
      isMounted = false
    }
  }, [developerMode.enabled])

  const {
    filters,
    filteredRecords,
    setStatus,
    setSearch,
    setDocumentFilter,
    setChargesFilter,
    setBotStatusFilter,
    setPackageTypeFilter,
    setClosingDateFilter,
    setShowArchived,
    clearFilters,
  } = useClosingTicketFilters(
    records,
    { userName, userId },
    ticketIdsWithCharges
  )

  // Auto-archive: tickets that have aged past their status's window
  // (Sent to AR > 10 days, Completed > 15 days) get flagged
  // cr109_archivalstatus = true so they're correctly reflected in
  // Dataverse, not just hidden client-side. The hide itself already
  // happens immediately via isEffectivelyArchived() in the filter, so this
  // sweep is purely to persist the flag — fire-and-forget, no need to
  // block or refetch.
  const archiveSweepRan = useRef(new Set<string>())
  useEffect(() => {
    const candidates = findTicketsNeedingAutoArchive(records).filter(
      (record) =>
        !archiveSweepRan.current.has(
          record.cr7de_closingticketdetailsid
        )
    )
    if (candidates.length === 0) return

    for (const record of candidates) {
      archiveSweepRan.current.add(record.cr7de_closingticketdetailsid)
      void updateClosingTicket(
        record.cr7de_closingticketdetailsid,
        { cr109_archivalstatus: true },
        record
      )
        .then(() => {
          writeActionLog({
            ticketId:
              record.cr7de_ticketid ??
              record.cr7de_closingticketdetailsid,
            tableName: 'cr7de_closingticketdetailses',
            action: 'Auto-Archived',
            details: {
              ticketStatus: record.cr7de_ticketstatus,
              lastModified: record.modifiedon,
            },
          })
        })
        .catch((error) => {
          logAppFailure({
            ticketId:
              record.cr7de_ticketid ??
              record.cr7de_closingticketdetailsid,
            tableName: 'cr7de_closingticketdetailses',
            context: 'Auto-Archive',
            error,
          })
        })
    }
  }, [records])

  const handleToggleArchive = async (
    recordId: string,
    nextArchived: boolean
  ) => {
    const record = records.find(
      (r) => r.cr7de_closingticketdetailsid === recordId
    )
    const ticketId = record?.cr7de_ticketid ?? recordId

    try {
      await updateClosingTicket(
        recordId,
        { cr109_archivalstatus: nextArchived },
        record
      )
      writeActionLog({
        ticketId,
        tableName: 'cr7de_closingticketdetailses',
        action: nextArchived
          ? 'Developer Status Override — Archived'
          : 'Developer Status Override — Unarchived',
      })
      await refresh()
    } catch (error) {
      logAppFailure({
        ticketId,
        tableName: 'cr7de_closingticketdetailses',
        context: nextArchived ? 'Archive Ticket' : 'Unarchive Ticket',
        error,
      })
    }
  }

  const isDashboardVisible =
    !selectedRecordId &&
    !bulkStatusScreenOpen &&
    !bulkCreateScreenOpen &&
    !userActivityOpen

  // The dashboard subtree unmounts while a details/bulk screen is open and
  // remounts when the user navigates back — but useClosingTickets() lives
  // up here, in the parent, so its one-time mount fetch doesn't rerun on
  // that "back" navigation. Refresh explicitly whenever the dashboard
  // becomes the visible view again, skipping the very first render (the
  // hook's own mount effect already covers that).
  const skipNextDashboardRefresh = useRef(true)
  useEffect(() => {
    if (!isDashboardVisible) return
    if (skipNextDashboardRefresh.current) {
      skipNextDashboardRefresh.current = false
      return
    }
    void refresh()
  }, [isDashboardVisible, refresh])

  const dashboardColumns = useMemo(
    () =>
      developerMode.enabled
        ? [...closingTicketColumns, botStatusColumn, failureReasonColumn]
        : closingTicketColumns,
    [developerMode.enabled]
  )

  const welcomeMessage = userName
    ? `Welcome, ${userName}!`
    : 'Welcome'

  const handleCreateClosing = async () => {
    clearFilters()
    await refresh()
    setCreateFormOpen(false)
    setCreateSuccessMessage(
      'Closing record created successfully.'
    )
  }

  const handleDetailsSaved = async () => {
    await refresh()
  }

  if (bulkStatusScreenOpen) {
    return (
      <>
        <TopNav userName={userName} onHelp={() => setHelpOpen(true)} />
        <HelpCentreModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        <div className="min-h-screen bg-[#F5F2EC]">
          <BulkStatusChangeScreen
            records={records}
            userName={userName}
            userId={userId}
            onBack={() => setBulkStatusScreenOpen(false)}
            onApplied={refresh}
          />
        </div>
      </>
    )
  }

  if (bulkCreateScreenOpen) {
    return (
      <>
        <TopNav userName={userName} onHelp={() => setHelpOpen(true)} />
        <HelpCentreModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        <div className="min-h-screen bg-[#F5F2EC]">
          <BulkCreateClosingsScreen
            onBack={() => setBulkCreateScreenOpen(false)}
            onApplied={refresh}
          />
        </div>
      </>
    )
  }

  if (userActivityOpen) {
    return (
      <>
        <TopNav userName={userName} onHelp={() => setHelpOpen(true)} />
        <HelpCentreModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        <div className="min-h-screen bg-[#F5F2EC]">
          <UserActivityPanel
            records={records}
            onBack={() => setUserActivityOpen(false)}
            onSelectTicket={(recordId) => {
              setUserActivityOpen(false)
              setSelectedRecordId(recordId)
            }}
          />
        </div>
      </>
    )
  }

  if (selectedRecordId) {
    return (
      <>
        <TopNav userName={userName} onHelp={() => setHelpOpen(true)} />
        <HelpCentreModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        <div className="min-h-screen bg-[#F5F2EC]">
          <ClosingTicketDetailsPage
            recordId={selectedRecordId}
            onBack={() => setSelectedRecordId(null)}
            onSaved={handleDetailsSaved}
          />
        </div>
      </>
    )
  }

  if (loading && !error) {
    return <LoadingScreen />
  }

  return (
    <>
      <TopNav userName={userName} onHelp={() => setHelpOpen(true)} />
      <HelpCentreModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <div className="min-h-screen bg-[#F5F2EC] px-4 py-2 sm:px-6 lg:px-8">
        <main className="mx-auto grid w-full max-w-[1500px] gap-2">
          <PageHeader
            eyebrow="Closing Management"
            title={welcomeMessage}
            description="Monitor closings, validate workflow status, and manage owner-ticket handoffs from a single workspace."
            gradient="linear-gradient(135deg, #dce8ef 0%, #F5F2EC 55%, #EDE8E0 100%)"
            actions={
              <>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#1E3A47] bg-transparent px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] transition hover:bg-[rgba(30,58,71,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={refresh}
                  disabled={loading}
                >
                  <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
                  {loading ? 'Refreshing' : 'Refresh'}
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#1E3A47] px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F2EC] shadow-sm transition hover:bg-[#152d38]"
                  type="button"
                  onClick={() => {
                    setCreateSuccessMessage(null)
                    setCreateFormOpen(true)
                  }}
                >
                  <Plus className="size-4" />
                  Create New Closing
                </button>
              </>
            }
          />

          {developerMode.isAllowed && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D5CBB8] bg-white px-4 py-2.5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
                  Admin Tools
                </span>
                <DeveloperModeToggle
                  enabled={developerMode.enabled}
                  onToggle={developerMode.toggle}
                  size="compact"
                />
                {developerMode.enabled && (
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] transition hover:bg-[#F5F2EC]"
                    type="button"
                    onClick={() => setUserActivityOpen(true)}
                  >
                    <PieChart className="size-4" />
                    User Activity
                  </button>
                )}
              </div>

              {developerMode.enabled && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] transition hover:bg-[#F5F2EC]"
                    type="button"
                    onClick={() => setLogsViewerOpen(true)}
                  >
                    <ScrollText className="size-4" />
                    View Logs
                  </button>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] transition hover:bg-[#F5F2EC]"
                    type="button"
                    onClick={() => setTablesReferenceOpen(true)}
                  >
                    <Database className="size-4" />
                    Dataverse Tables
                  </button>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] transition hover:bg-[#F5F2EC]"
                    type="button"
                    onClick={() => setBulkStatusScreenOpen(true)}
                  >
                    <ListChecks className="size-4" />
                    Bulk Status Change
                  </button>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] transition hover:bg-[#F5F2EC]"
                    type="button"
                    onClick={() => setBulkCreateScreenOpen(true)}
                  >
                    <FilePlus2 className="size-4" />
                    Bulk Create Closings
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <StatusBanner
              type="error"
              message={error}
            />
          )}

          {createSuccessMessage && (
            <StatusBanner
              type="success"
              message={createSuccessMessage}
            />
          )}

          {!loading &&
            !error &&
            records.length === 0 && (
              <EmptyState
                title="No closing records"
                description="No records were returned from Dataverse for this environment."
              />
            )}

          {records.length > 0 && (
            <div className="grid gap-2">
              <ClosingTicketDashboard
                totalRecords={records.length}
                records={records}
              />

              <ClosingTicketFilters
                filters={filters}
                records={records}
                onStatusChange={setStatus}
                onSearchChange={setSearch}
                showDocumentFilter={developerMode.enabled}
                onDocumentFilterChange={setDocumentFilter}
                showChargesFilter={developerMode.enabled}
                onChargesFilterChange={setChargesFilter}
                showBotStatusFilter={developerMode.enabled}
                onBotStatusFilterChange={setBotStatusFilter}
                showPackageTypeFilter={developerMode.enabled}
                onPackageTypeFilterChange={setPackageTypeFilter}
                showDeveloperStatusTabs={developerMode.enabled}
                showClosingDateFilter={developerMode.enabled}
                onClosingDateFilterChange={setClosingDateFilter}
                showArchivedToggle={developerMode.enabled}
                onShowArchivedChange={setShowArchived}
              />

              {filteredRecords.length === 0 ? (
                <EmptyState
                  title="No matching records"
                  description="Adjust the status or search text to broaden the result set."
                />
              ) : (
                <ClosingTicketTable
                  records={filteredRecords}
                  columns={dashboardColumns}
                  onRecordSelect={(recordId) => {
                    setCreateSuccessMessage(null)
                    setSelectedRecordId(recordId)
                  }}
                  showArchiveActions={developerMode.enabled}
                  onToggleArchive={handleToggleArchive}
                />
              )}
            </div>
          )}
        </main>

        <Sheet open={createFormOpen} onOpenChange={setCreateFormOpen}>
          <SheetContent className="create-closing-sheet">
            <SheetHeader className="create-closing-sheet-header">
              <div>
                <SheetDescription className="text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
                  Create closing record
                </SheetDescription>
                <SheetTitle
                  id="create-closing-title"
                  className="text-xl font-semibold text-[#1E3A47]"
                  style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}
                >
                  New Closing Ticket
                </SheetTitle>
              </div>
              <button
                type="button"
                className="invoice-viewer-close-btn"
                onClick={() => setCreateFormOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </SheetHeader>

            <div className="create-closing-sheet-body">
              <CreateClosingTicketForm
                onCancel={() => setCreateFormOpen(false)}
                onCreated={handleCreateClosing}
                onViewExistingTicket={(recordId) => {
                  setCreateFormOpen(false)
                  setSelectedRecordId(recordId)
                }}
                developerModeEnabled={developerMode.enabled}
              />
            </div>
          </SheetContent>
        </Sheet>

        {developerMode.isAllowed && (
          <AppLogsViewer
            open={logsViewerOpen}
            onOpenChange={setLogsViewerOpen}
          />
        )}

        {developerMode.isAllowed && (
          <DataverseTablesReference
            open={tablesReferenceOpen}
            onOpenChange={setTablesReferenceOpen}
          />
        )}

        {developerMode.isAllowed && (
          <DeveloperModePasswordPrompt
            open={developerMode.promptOpen}
            error={developerMode.passwordError}
            onSubmit={developerMode.submitPassword}
            onCancel={developerMode.cancelPrompt}
          />
        )}
      </div>
    </>
  )
}
