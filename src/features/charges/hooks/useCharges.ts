import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getBuyerLedgersByTicketId,
  getScheduledChargesByTicketId,
  getSellerLedgersByTicketId,
  getUnpaidChargesByTicketId,
  updateSellerLedgerChargeStatus,
  SellerLedgerChargeStatus,
} from '../api/chargesService'
import type {
  BuyerLedgerRecord,
  ScheduledChargeRecord,
  SellerLedgerRecord,
  UnpaidChargeRecord,
} from '../types/charges'

export function useCharges(ticketId?: string) {
  const [unpaidCharges, setUnpaidCharges] = useState<
    UnpaidChargeRecord[]
  >([])
  const [scheduledCharges, setScheduledCharges] = useState<
    ScheduledChargeRecord[]
  >([])
  const [sellerLedgers, setSellerLedgers] = useState<
    SellerLedgerRecord[]
  >([])
  const [buyerLedgers, setBuyerLedgers] = useState<
    BuyerLedgerRecord[]
  >([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const initialLoad = useRef(false)
  const [error, setError] = useState<string | null>(null)

  const normalizeText = (value?: string) => value?.trim() ?? ''

  const extractChargeCode = (description?: string) => {
    if (!description) {
      return ''
    }

    const [beforeDash] = description.split('-')
    return normalizeText(beforeDash)
  }

  const getChargeStatusLabel = (
    status?: number
  ): 'Active' | 'InActive' | undefined => {
    if (status === SellerLedgerChargeStatus.Active) {
      return 'Active'
    }

    if (status === SellerLedgerChargeStatus.InActive) {
      return 'InActive'
    }

    return undefined
  }

  const refresh = useCallback(async () => {
    if (!ticketId?.trim()) {
      setUnpaidCharges([])
      setScheduledCharges([])
      setSellerLedgers([])
      setBuyerLedgers([])
      initialLoad.current = false
      setLoading(false)
      setRefreshing(false)
      return
    }

    const isInitialLoad = !initialLoad.current
    if (isInitialLoad) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const [
        unpaidRecords,
        scheduledRecords,
        sellerLedgerRecords,
        buyerLedgerRecords,
      ] =
        await Promise.all([
          getUnpaidChargesByTicketId(ticketId),
          getScheduledChargesByTicketId(ticketId),
          getSellerLedgersByTicketId(ticketId),
          getBuyerLedgersByTicketId(ticketId),
        ])

      setUnpaidCharges(unpaidRecords)
      setScheduledCharges(scheduledRecords)

      const chargeCodeToMove = new Map<string, boolean>()
      unpaidRecords.forEach((record) => {
        const code = normalizeText(record.cr109_chargecode)
        if (code) {
          chargeCodeToMove.set(code, Boolean(record.cr109_move))
        }
      })

      await Promise.all(
        sellerLedgerRecords.map(async (record) => {
          const sellerCode = extractChargeCode(
            record.cr109_description
          )
          if (!sellerCode || !chargeCodeToMove.has(sellerCode)) {
            return
          }

          const shouldBeInactive =
            chargeCodeToMove.get(sellerCode)
          const currentStatus = getChargeStatusLabel(
            record.cr109_chargestatus
          )

          if (
            shouldBeInactive &&
            currentStatus !== 'InActive'
          ) {
            await updateSellerLedgerChargeStatus(
              record.crc5c_sellerledgerid,
              'InActive'
            )
          } else if (
            !shouldBeInactive &&
            currentStatus !== 'Active'
          ) {
            await updateSellerLedgerChargeStatus(
              record.crc5c_sellerledgerid,
              'Active'
            )
          }
        })
      )

      const visibleSellerLedgers = sellerLedgerRecords.filter(
        (record) => {
          const sellerCode = extractChargeCode(
            record.cr109_description
          )
          if (!sellerCode) {
            return true
          }

          return !chargeCodeToMove.get(sellerCode)
        }
      )

      setSellerLedgers(visibleSellerLedgers)
      setBuyerLedgers(buyerLedgerRecords)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load charges.'
      )
    } finally {
      initialLoad.current = true
      setLoading(false)
      setRefreshing(false)
    }
  }, [ticketId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    unpaidCharges,
    scheduledCharges,
    sellerLedgers,
    buyerLedgers,
    loading,
    refreshing,
    error,
    refresh,
  }
}
