import { useCallback, useEffect, useState } from 'react'
import {
  getScheduledChargesByTicketId,
  getUnpaidChargesByTicketId,
} from '../api/chargesService'
import type {
  ScheduledChargeRecord,
  UnpaidChargeRecord,
} from '../types/charges'

export function useCharges(ticketId?: string) {
  const [unpaidCharges, setUnpaidCharges] = useState<
    UnpaidChargeRecord[]
  >([])
  const [scheduledCharges, setScheduledCharges] = useState<
    ScheduledChargeRecord[]
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!ticketId?.trim()) {
      setUnpaidCharges([])
      setScheduledCharges([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [unpaidRecords, scheduledRecords] =
        await Promise.all([
          getUnpaidChargesByTicketId(ticketId),
          getScheduledChargesByTicketId(ticketId),
        ])

      setUnpaidCharges(unpaidRecords)
      setScheduledCharges(scheduledRecords)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load charges.'
      )
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    unpaidCharges,
    scheduledCharges,
    loading,
    error,
    refresh,
  }
}
