import {
  Crc5c_buyerledgersService,
  Crc5c_copyscheduledchargesesService,
  Crc5c_sellerledgersService,
  Crc5c_unpaidchargesesService,
} from '../../../generated'
import type {
  BuyerLedgerRecord,
  ScheduledChargeRecord,
  ScheduledChargeUpdateInput,
  SellerLedgerRecord,
  UnpaidChargeRecord,
  UnpaidChargeUpdateInput,
} from '../types/charges'

function escapeODataString(value: string) {
  return value.replace(/'/g, "''")
}

function normalizeLedgerValue(value?: string) {
  return value?.trim() ?? ''
}

function extractSellerChargeCode(description?: string) {
  if (!description) {
    return ''
  }

  const [chargeCode] = description.split('-')
  return normalizeLedgerValue(chargeCode)
}

export const SellerLedgerChargeStatus = {
  Active: 396620000,
  InActive: 396620001,
} as const

export type SellerLedgerChargeStatus = keyof typeof SellerLedgerChargeStatus

export async function updateSellerLedgerChargeStatus(
  sellerLedgerId: string,
  status: SellerLedgerChargeStatus
): Promise<void> {
  const result = await Crc5c_sellerledgersService.update(
    sellerLedgerId,
    {
      cr109_chargestatus:
        SellerLedgerChargeStatus[status],
    }
  )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to update seller ledger charge status'
    )
  }
}

export async function updateSellerLedgerPaymentsAndBalance(
  sellerLedgerId: string,
  payments: string,
  balance: string
): Promise<void> {
  const result = await Crc5c_sellerledgersService.update(
    sellerLedgerId,
    {
      cr109_payments: payments,
      cr109_balance: balance,
    }
  )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to update seller ledger payments and balance'
    )
  }
}

export async function updateBuyerLedgerPaymentsAndBalance(
  buyerLedgerId: string,
  payments: string,
  balance: string
): Promise<void> {
  const result = await Crc5c_buyerledgersService.update(
    buyerLedgerId,
    {
      cr109_payments: payments,
      cr109_balance: balance,
    }
  )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to update buyer ledger payments and balance'
    )
  }
}

function parseLedgerNumber(value?: string) {
  if (!value) {
    return 0
  }

  const parsed = Number(value.replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

function formatLedgerNumber(value: number) {
  return value.toFixed(2)
}

function sortByIndexAscending<
  T extends { cr109_index?: string }
>(records: T[]) {
  return [...records].sort((a, b) => {
    const indexA = Number(a.cr109_index ?? '0')
    const indexB = Number(b.cr109_index ?? '0')
    return indexA - indexB
  })
}

export async function getUnpaidChargesByTicketId(
  ticketId: string
): Promise<UnpaidChargeRecord[]> {
  if (!ticketId.trim()) {
    return []
  }

  const response =
    await Crc5c_unpaidchargesesService.getAll({
      filter: `crc5c_ticketid eq '${escapeODataString(
        ticketId
      )}'`,
      orderBy: ['createdon desc'],
    })

  if (!response.success) {
    throw new Error(
      response.error?.message ||
        'Failed to load unpaid charges'
    )
  }

  return (response.data ?? []) as UnpaidChargeRecord[]
}

export async function getScheduledChargesByTicketId(
  ticketId: string
): Promise<ScheduledChargeRecord[]> {
  if (!ticketId.trim()) {
    return []
  }

  const response =
    await Crc5c_copyscheduledchargesesService.getAll({
      filter: `crc5c_ticketid eq '${escapeODataString(
        ticketId
      )}'`,
      orderBy: ['createdon desc'],
    })

  if (!response.success) {
    throw new Error(
      response.error?.message ||
        'Failed to load scheduled charges'
    )
  }

  return (response.data ?? []) as ScheduledChargeRecord[]
}

export async function getSellerLedgersByTicketId(
  ticketId: string
): Promise<SellerLedgerRecord[]> {
  if (!ticketId.trim()) {
    return []
  }

  const response =
    await Crc5c_sellerledgersService.getAll({
      filter: `crc5c_ticketid eq '${escapeODataString(
        ticketId
      )}'`,
      orderBy: ['cr109_index asc'],
    })

  if (!response.success) {
    throw new Error(
      response.error?.message ||
        'Failed to load seller ledgers'
    )
  }

  return (response.data ?? []) as SellerLedgerRecord[]
}

export async function getBuyerLedgersByTicketId(
  ticketId: string
): Promise<BuyerLedgerRecord[]> {
  if (!ticketId.trim()) {
    return []
  }

  const response =
    await Crc5c_buyerledgersService.getAll({
      filter: `crc5c_ticketid eq '${escapeODataString(
        ticketId
      )}'`,
      orderBy: ['cr109_index asc'],
    })

  if (!response.success) {
    throw new Error(
      response.error?.message ||
        'Failed to load buyer ledgers'
    )
  }

  return (response.data ?? []) as BuyerLedgerRecord[]
}

export async function syncBuyerLedgerWithUnpaidCharge(
  previousCharge: UnpaidChargeRecord,
  currentCharge: UnpaidChargeRecord
) {
  const ticketId =
    currentCharge.crc5c_ticketid?.trim() ||
    previousCharge.crc5c_ticketid?.trim()
  if (!ticketId) {
    return
  }

  const allLedgers = await getBuyerLedgersByTicketId(ticketId)
  const findMatches = (charge: UnpaidChargeRecord) =>
    allLedgers.filter((ledger) => {
      return (
        normalizeLedgerValue(ledger.cr109_date) ===
          normalizeLedgerValue(charge.cr109_date) &&
        normalizeLedgerValue(ledger.cr109_description) ===
          normalizeLedgerValue(charge.cr109_notes) &&
        normalizeLedgerValue(ledger.cr109_charges) ===
          normalizeLedgerValue(charge.cr109_amount)
      )
    })

  const previousMatches = findMatches(previousCharge)
  const currentMatches = findMatches(currentCharge)

  if (currentCharge.cr109_move) {
    if (previousMatches.length > 0) {
      const [targetRecord] = previousMatches
      const updateResult =
        await Crc5c_buyerledgersService.update(
          targetRecord.crc5c_buyerledgerid,
          {
            crc5c_ticketid: ticketId,
            cr109_date: currentCharge.cr109_date,
            cr109_description: currentCharge.cr109_notes,
            cr109_charges: currentCharge.cr109_amount,
          }
        )

      if (!updateResult.success) {
        throw new Error(
          updateResult.error?.message ||
            'Failed to update buyer ledger record'
        )
      }
    } else if (currentMatches.length === 0) {
      const nextIndex = String(allLedgers.length + 1)

      const createResult =
        await Crc5c_buyerledgersService.create({
          crc5c_ticketid: ticketId,
          cr109_date: currentCharge.cr109_date,
          cr109_description: currentCharge.cr109_notes,
          cr109_charges: currentCharge.cr109_amount,
          cr109_payments: undefined,
          cr109_index: nextIndex,
        } as unknown as Omit<
          BuyerLedgerRecord,
          'crc5c_buyerledgerid'
        >)

      if (!createResult.success) {
        throw new Error(
          createResult.error?.message ||
            'Failed to create buyer ledger record'
        )
      }
    }
  } else if (
    previousMatches.length > 0 ||
    currentMatches.length > 0
  ) {
    const recordsToDelete = [
      ...new Map(
        [...previousMatches, ...currentMatches].map(
          (record) => [record.crc5c_buyerledgerid, record]
        )
      ).values(),
    ]

    await Promise.all(
      recordsToDelete.map((ledger) =>
        Crc5c_buyerledgersService.delete(
          ledger.crc5c_buyerledgerid
        )
      )
    )
  }

  await recalculateBuyerLedgerBalances(ticketId)
}

async function recalculateBuyerLedgerBalances(
  ticketId: string
) {
  const records = sortByIndexAscending(
    await getBuyerLedgersByTicketId(ticketId)
  )

  let runningBalance = 0

  await Promise.all(
    records.map(async (record, index) => {
      runningBalance +=
        parseLedgerNumber(record.cr109_charges) -
        parseLedgerNumber(record.cr109_payments)

      const nextIndex = String(index + 1)
      const nextBalance =
        formatLedgerNumber(runningBalance)

      await Crc5c_buyerledgersService.update(
        record.crc5c_buyerledgerid,
        {
          cr109_index: nextIndex,
          cr109_balance: nextBalance,
        }
      )
    })
  )
}

export async function updateUnpaidCharge(
  chargeId: string,
  changedFields: UnpaidChargeUpdateInput
): Promise<UnpaidChargeRecord> {
  const result =
    await Crc5c_unpaidchargesesService.update(
      chargeId,
      changedFields
    )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to update unpaid charge'
    )
  }

  return result.data as UnpaidChargeRecord
}

export async function updateScheduledCharge(
  chargeId: string,
  changedFields: ScheduledChargeUpdateInput
): Promise<ScheduledChargeRecord> {
  const result =
    await Crc5c_copyscheduledchargesesService.update(
      chargeId,
      changedFields
    )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to update scheduled charge'
    )
  }

  return result.data as ScheduledChargeRecord
}
