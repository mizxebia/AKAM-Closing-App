import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import akamLogo from '../../../assets/akam_logo.png'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '../../../components/enterprise'
import { closingTicketColumns } from '../constants/closingTicketColumns'
import { useClosingTicketFilters } from '../hooks/useClosingTicketFilters'
import { useClosingTickets } from '../hooks/useClosingTickets'
import { ClosingTicketDashboard } from './ClosingTicketDashboard'
import { ClosingTicketFilters } from './ClosingTicketFilters'
import { ClosingTicketTable } from './ClosingTicketTable'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { CreateClosingTicketForm } from './CreateClosingTicketForm'
import { ClosingTicketDetailsPage } from './ClosingTicketDetailsPage'

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function TopNav({ userName }: { userName: string | null }) {
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
          style={{ height: '36px', width: 'auto' }}
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
        <span
          style={{
            color: 'rgba(245,242,236,0.7)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'default',
          }}
        >
          Help Center
        </span>
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

  const {
    records,
    loading,
    error,
    refresh,
  } = useClosingTickets()

  const {
    filters,
    filteredRecords,
    setStatus,
    setBuildingCode,
    setUnit,
    clearFilters,
  } = useClosingTicketFilters(records)

  const { userName } = useCurrentUser()
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

  if (selectedRecordId) {
    return (
      <>
        <TopNav userName={userName} />
        <div className="min-h-screen bg-[#F5F2EC] px-4 py-5 sm:px-6 lg:px-8">
          <ClosingTicketDetailsPage
            recordId={selectedRecordId}
            onBack={() => setSelectedRecordId(null)}
            onSaved={handleDetailsSaved}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <TopNav userName={userName} />
      <div className="min-h-screen bg-[#F5F2EC] px-4 py-5 sm:px-6 lg:px-8">
        <main className="mx-auto grid w-full max-w-[1500px] gap-3">
          <PageHeader
            eyebrow="Closing Management"
            title={welcomeMessage}
            description="Monitor closings, validate workflow status, and manage owner-ticket handoffs from a single workspace."
            actions={
              <>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#1E3A47] bg-transparent px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] transition hover:bg-[rgba(30,58,71,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={refresh}
                  disabled={loading}
                >
                  <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
                  {loading ? 'Refreshing' : 'Refresh'}
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1E3A47] px-5 text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F2EC] shadow-sm transition hover:bg-[#152d38]"
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

        {loading && (
          <LoadingSkeleton />
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
          <div className="grid gap-3">
            <ClosingTicketDashboard
              totalRecords={records.length}
              records={records}
            />

            <ClosingTicketFilters
              filters={filters}
              onStatusChange={setStatus}
              onBuildingCodeChange={setBuildingCode}
              onUnitChange={setUnit}
            />

            {filteredRecords.length === 0 ? (
              <EmptyState
                title="No matching records"
                description="Adjust the status, building code, or unit filters to broaden the result set."
              />
            ) : (
              <ClosingTicketTable
                records={filteredRecords}
                columns={closingTicketColumns}
                onRecordSelect={(recordId) => {
                  setCreateSuccessMessage(null)
                  setSelectedRecordId(recordId)
                }}
              />
            )}
          </div>
        )}
        </main>

        {createFormOpen && (
          <div
            className="modal-backdrop"
            role="presentation"
          >
            <section
              className="modal-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-closing-title"
            >
              <div className="modal-header">
                <div>
                  <p>View and edit property closing record</p>
                  <h2 id="create-closing-title">
                    New Closing
                  </h2>
                </div>
                <button
                  className="modal-close-button"
                  type="button"
                  onClick={() =>
                    setCreateFormOpen(false)
                  }
                  aria-label="Close create closing form"
                >
                  x
                </button>
              </div>

              <CreateClosingTicketForm
                onCancel={() => setCreateFormOpen(false)}
                onCreated={handleCreateClosing}
              />
            </section>
          </div>
        )}
      </div>
    </>
  )
}
