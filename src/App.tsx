import { useEffect, useState } from 'react'
import { Cr7de_closingticketdetailsesService } from './generated'
import type { Cr7de_closingticketdetailses } from './generated/models/Cr7de_closingticketdetailsesModel'
import { ClosingTicketTable, type Column } from './components/ClosingTicketTable'
import { StatusBanner } from './components/StatusBanner'
import './App.css'

type ClosingTicketRecord = Cr7de_closingticketdetailses & {
  cr7de_name?: string
}

const columns: Column[] = [
  {
    key: 'cr7de_ticketid',
    label: 'Ticket ID',
  },
  {
    key: 'cr7de_buyername',
    label: 'Buyer Name',
  },
  {
    key: 'cr7de_sellername',
    label: 'Seller Name',
  },
  {
    key: 'cr7de_buildingname',
    label: 'Building Name',
  },
  {
    key: 'cr7de_unitnumber',
    label: 'Unit Number',
  },
  {
    key: 'cr7de_closingdate',
    label: 'Closing Date',
  },
  {
    key: 'cr7de_ticketstatus',
    label: 'Status',
  },
]
function App() {
  const [records, setRecords] = useState<ClosingTicketRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = async () => {
    setLoading(true)
    setError(null)

    try {
      const response =
        await Cr7de_closingticketdetailsesService.getAll()

      console.log('Dataverse raw response:', response)

      if (!response.success) {
        throw new Error(
          response.error?.message ||
            'Failed to fetch records'
        )
      }

      setRecords((response.data ?? []) as ClosingTicketRecord[])
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unknown error occurred'
      )

      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">Closing Ticket Details</h1>
          <p className="app-subtitle">
            Dataverse table: <strong>cr7de_closingticketdetails</strong>
          </p>
        </div>

        <button
          className="refresh-button"
          type="button"
          onClick={fetchRecords}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Records'}
        </button>
      </header>

      {loading && (
        <StatusBanner type="loading" message="Loading records from Dataverse..." />
      )}

      {error && <StatusBanner type="error" message={error} />}

      {!loading && !error && records.length === 0 && (
        <StatusBanner type="info" message="No records were returned from Dataverse." />
      )}

      {records.length > 0 && <ClosingTicketTable records={records} columns={columns} />}
    </div>
  )
}


export default App