import { useCallback, useEffect, useRef, useState } from 'react'
import { usePolling } from '../../../hooks/usePolling'
import {
  getBuyerLedgersByTicketId,
  getScheduledChargesByTicketId,
  getSellerLedgersByTicketId,
  getUnpaidChargesByTicketId,
  syncBuyerLedgerWithUnpaidCharge,
  updateSellerLedgerChargeStatus,
  SellerLedgerChargeStatus,
} from '../api/chargesService'
import type {
  BuyerLedgerRecord,
  ScheduledChargeRecord,
  SellerLedgerRecord,
  UnpaidChargeRecord,
} from '../types/charges'

function normalizeText(value?: string) {
  return value?.trim() ?? ''
}

function normalizeLedgerValue(value?: string) {
  return value?.trim() ?? ''
}

function extractChargeCode(description?: string) {
  if (!description) {
    return ''
  }
  const [beforeDash] = description.split('-')
  return normalizeText(beforeDash)
}

function getChargeStatusLabel(
  status?: number
): 'Active' | 'InActive' | undefined {
  if (status === SellerLedgerChargeStatus.Active) {
    return 'Active'
  }
  if (status === SellerLedgerChargeStatus.InActive) {
    return 'InActive'
  }
  return undefined
}

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
              'InActive',
              { ticketId, oldRecord: record }
            )
          } else if (
            !shouldBeInactive &&
            currentStatus !== 'Active'
          ) {
            await updateSellerLedgerChargeStatus(
              record.crc5c_sellerledgerid,
              'Active',
              { ticketId, oldRecord: record }
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

      // Reconcile buyer ledger for any unpaid charge that has cr109_move = true
      // but no corresponding buyer ledger entry. This handles records created or
      // updated via backend flows/desktop flows that bypass the app's save path.
      const chargesNeedingSync = unpaidRecords.filter(
        (charge) => charge.cr109_move
      )
      if (chargesNeedingSync.length > 0) {
        // Build a quick lookup of existing buyer ledger entries to avoid
        // re-reading Dataverse inside syncBuyerLedgerWithUnpaidCharge for each
        // record — we pass the same charge as both prev and current so the
        // function only runs the "create if missing" branch.
        for (const charge of chargesNeedingSync) {
          const alreadySynced = buyerLedgerRecords.some(
            (ledger) =>
              normalizeLedgerValue(ledger.cr109_date) ===
                normalizeLedgerValue(charge.cr109_date) &&
              normalizeLedgerValue(ledger.cr109_description) ===
                normalizeLedgerValue(charge.cr109_notes) &&
              normalizeLedgerValue(ledger.cr109_charges) ===
                normalizeLedgerValue(charge.cr109_amount)
          )
          if (!alreadySynced) {
            // Pass the same record as both prev and current — syncBuyerLedgerWithUnpaidCharge
            // will see move=true with no previous match and create the ledger entry.
            await syncBuyerLedgerWithUnpaidCharge(charge, charge)
          }
        }
      }

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

  // Silent background polling — re-fetches every 30s while the tab is visible
  // and the user isn't actively editing a field. Uses `refreshing` (already
  // returned) as the in-flight indicator so consumers can show a subtle sync dot.
  usePolling(refresh, 30_000, !!ticketId?.trim())

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
