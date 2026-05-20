import { useState } from 'react'
import {
  Plus,
  RefreshCw,
} from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '../../../components/enterprise'
import { Button } from '../../../components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet'
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
              <Button
                variant="outline"
                className="h-10 rounded-lg border-slate-200 bg-white px-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                type="button"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
                {loading ? 'Refreshing' : 'Refresh'}
              </Button>
              <Button
                className="h-10 rounded-lg bg-slate-950 px-4 font-semibold text-white shadow-sm hover:bg-slate-800"
                type="button"
                onClick={() => {
                  setCreateSuccessMessage(null)
                  setCreateFormOpen(true)
                }}
              >
                <Plus className="size-4" />
                Create New Closing
              </Button>
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

      <Sheet open={createFormOpen} onOpenChange={setCreateFormOpen}>
        <SheetContent className="create-closing-sheet">
          <SheetHeader className="create-closing-sheet-header">
            <SheetDescription className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              View and edit property closing record
            </SheetDescription>
            <SheetTitle
              id="create-closing-title"
              className="text-xl font-semibold text-slate-950"
            >
              New Closing
            </SheetTitle>
          </SheetHeader>

          <div className="create-closing-sheet-body">
            <CreateClosingTicketForm
              onCancel={() => setCreateFormOpen(false)}
              onCreated={handleCreateClosing}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
