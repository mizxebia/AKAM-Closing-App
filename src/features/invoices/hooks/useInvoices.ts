import { useCallback, useEffect, useState } from 'react'
import { getInvoicesByClosingTicketId } from '../api/invoiceService'
import type { InvoiceRecord } from '../types/invoice'

export function useInvoices(ticketId?: string) {
  const [records, setRecords] = useState<InvoiceRecord[]>(
    []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!ticketId) {
      setRecords([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getInvoicesByClosingTicketId(
        ticketId
      )
      setRecords(data)
    } catch (err) {
      setRecords([])
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load invoice details.'
      )
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    records,
    loading,
    error,
    refresh,
  }
}

