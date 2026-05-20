import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
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
    ? `Welcome back, ${userName}!`
    : 'Welcome back'

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
      <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
        <ClosingTicketDetailsPage
          recordId={selectedRecordId}
          onBack={() => setSelectedRecordId(null)}
          onSaved={handleDetailsSaved}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-[1500px] gap-5">
        <PageHeader
          eyebrow="Closing Management"
          title={welcomeMessage}
          description="Monitor closings, validate workflow status, and manage owner-ticket handoffs from a single workspace."
          actions={
            <>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
                {loading ? 'Refreshing' : 'Refresh'}
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
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
        <div className="grid gap-5">
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
  )
}
