import { ClosingTicketTable } from '../ClosingTicketTable'
import { StatusBanner } from '../StatusBanner'
import { closingTicketColumns } from './columns'
import { useClosingTickets } from '../../hooks/useClosingTickets'

export function ClosingTicketPage() {
  const {
    records,
    loading,
    error,
    fetchRecords,
  } = useClosingTickets()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">
            Closing Ticket Details
          </h1>

          <p className="app-subtitle">
            Dataverse table:
            <strong>
              cr7de_closingticketdetails
            </strong>
          </p>
        </div>

        <button
          className="refresh-button"
          type="button"
          onClick={fetchRecords}
          disabled={loading}
        >
          {loading
            ? 'Refreshing...'
            : 'Refresh Records'}
        </button>
      </header>

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

      {!loading &&
        !error &&
        records.length === 0 && (
          <StatusBanner
            type="info"
            message="No records were returned from Dataverse."
          />
        )}

      {records.length > 0 && (
        <ClosingTicketTable
          records={records}
          columns={closingTicketColumns}
        />
      )}
    </div>
  )
}