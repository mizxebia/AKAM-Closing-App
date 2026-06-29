import { useCallback, useEffect, useState } from 'react'
import { getClosingTickets } from '../api/closingTicketsService'
import type { ClosingTicketRecord } from '../types/closingTicket'

export function useClosingTickets() {
  const [records, setRecords] = useState<
    ClosingTicketRecord[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getClosingTickets()
      setRecords(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unknown error occurred'
      )
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRecords()
  }, [fetchRecords])

  return {
    records,
    loading,
    error,
    refresh: fetchRecords,
  }
}
