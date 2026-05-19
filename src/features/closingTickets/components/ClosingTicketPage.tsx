import { useState } from 'react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { PlusIcon } from '../../../components/icons/DashboardIcons'
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
      <div className="app-shell">
        <ClosingTicketDetailsPage
          recordId={selectedRecordId}
          onBack={() => setSelectedRecordId(null)}
          onSaved={handleDetailsSaved}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">
            {welcomeMessage}
          </h1>

          <p className="app-subtitle">
            Here's an overview of your closings
          </p>
        </div>

        <button
          className="create-button"
          type="button"
          onClick={() => {
            setCreateSuccessMessage(null)
            setCreateFormOpen(true)
          }}
        >
          <PlusIcon className="icon-size-sm" />
          Create New Closing
        </button>
      </header>

      <div className="screen-actions">
        <button
          className="refresh-button"
          type="button"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Records'}
        </button>
      </div>

      {loading && (
        <StatusBanner
          type="loading"
          message="Loading records from Dataverse..."
        />
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
          <StatusBanner
            type="info"
            message="No records were returned from Dataverse."
          />
        )}

      {records.length > 0 && (
        <>
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
            <StatusBanner
              type="info"
              message="No records match the current filters."
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
        </>
      )}

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
