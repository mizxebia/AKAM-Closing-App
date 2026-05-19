import { useEffect, useState } from 'react'
import { getClosingTickets } from '../services/closingTicketService'
import type { ClosingTicketRecord } from '../types/closingTicket'

export const useClosingTickets = () => {
  const [records, setRecords] = useState<ClosingTicketRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getClosingTickets()
      setRecords(data)
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

  return {
    records,
    loading,
    error,
    fetchRecords,
  }
}