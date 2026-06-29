import {
  Crc5c_buyerledgersService,
  Crc5c_copyscheduledchargesesService,
  Crc5c_manualchargesesService,
  Crc5c_sellerledgersService,
  Crc5c_unpaidchargesesService,
} from '../../../generated'
import {
  Crc5c_manualchargesescr109_chargecode,
} from '../../../generated/models/Crc5c_manualchargesesModel'
import type {
  BuyerLedgerRecord,
  ManualChargeCreateInput,
  ScheduledChargeRecord,
  ScheduledChargeUpdateInput,
  SellerLedgerRecord,
  UnpaidChargeRecord,
  UnpaidChargeUpdateInput,
} from '../types/charges'
import {
  writeChangeLog,
  extractOldValues,
} from '../../auditLog/api/auditLogService'

const TABLE = {
  unpaidCharges: 'crc5c_unpaidchargeses',
  scheduledCharges: 'crc5c_copyscheduledchargeses',
  manualCharges: 'crc5c_manualchargeses',
  sellerLedgers: 'crc5c_sellerledgers',
  buyerLedgers: 'crc5c_buyerledgers',
} as const

function escapeODataString(value: string) {
  return value.replace(/'/g, "''")
}

function normalizeLedgerValue(value?: string) {
  return value?.trim() ?? ''
}


export const SellerLedgerChargeStatus = {
  Active: 396620000,
  InActive: 396620001,
} as const

export type SellerLedgerChargeStatus = keyof typeof SellerLedgerChargeStatus

export async function updateSellerLedgerChargeStatus(
  sellerLedgerId: string,
  status: SellerLedgerChargeStatus,
  context: { ticketId: string; oldRecord: SellerLedgerRecord }
): Promise<void> {
  const changedFields = {
    cr109_chargestatus: SellerLedgerChargeStatus[status],
  }

  const result = await Crc5c_sellerledgersService.update(
    sellerLedgerId,
    changedFields
  )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to update seller ledger charge status'
    )
  }

  writeChangeLog({
    ticketId: context.ticketId,
    tableName: TABLE.sellerLedgers,
    operation: 'update',
    oldData: extractOldValues(
      context.oldRecord,
      changedFields as Partial<SellerLedgerRecord>
    ),
    newData: changedFields as Record<string, unknown>,
  })
}

export async function updateSellerLedgerPaymentsAndBalance(
  sellerLedgerId: string,
  payments: string,
  balance: string,
  context: { ticketId: string; oldRecord: SellerLedgerRecord }
): Promise<void> {
  const changedFields = {
    cr109_payments: payments,
    cr109_balance: balance,
  }

  const result = await Crc5c_sellerledgersService.update(
    sellerLedgerId,
    changedFields
  )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to update seller ledger payments and balance'
    )
  }

  writeChangeLog({
    ticketId: context.ticketId,
    tableName: TABLE.sellerLedgers,
    operation: 'update',
    oldData: extractOldValues(
      context.oldRecord,
      changedFields as Partial<SellerLedgerRecord>
    ),
    newData: changedFields as Record<string, unknown>,
  })
}

export async function updateBuyerLedgerPaymentsAndBalance(
  buyerLedgerId: string,
  payments: string,
  balance: string,
  context: { ticketId: string; oldRecord: BuyerLedgerRecord }
): Promise<void> {
  const changedFields = {
    cr109_payments: payments,
    cr109_balance: balance,
  }

  const result = await Crc5c_buyerledgersService.update(
    buyerLedgerId,
    changedFields
  )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to update buyer ledger payments and balance'
    )
  }

  writeChangeLog({
    ticketId: context.ticketId,
    tableName: TABLE.buyerLedgers,
    operation: 'update',
    oldData: extractOldValues(
      context.oldRecord,
      changedFields as Partial<BuyerLedgerRecord>
    ),
    newData: changedFields as Record<string, unknown>,
  })
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
  ticketId: string,
  existingRecords?: BuyerLedgerRecord[]
) {
  const records = sortByIndexAscending(
    existingRecords ?? await getBuyerLedgersByTicketId(ticketId)
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
  changedFields: UnpaidChargeUpdateInput,
  context: { ticketId: string; oldRecord: UnpaidChargeRecord }
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

  writeChangeLog({
    ticketId: context.ticketId,
    tableName: TABLE.unpaidCharges,
    operation: 'update',
    oldData: extractOldValues(
      context.oldRecord,
      changedFields as Partial<UnpaidChargeRecord>
    ),
    newData: changedFields as Record<string, unknown>,
  })

  return result.data as UnpaidChargeRecord
}

export async function updateScheduledCharge(
  chargeId: string,
  changedFields: ScheduledChargeUpdateInput,
  context: { ticketId: string; oldRecord: ScheduledChargeRecord }
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

  writeChangeLog({
    ticketId: context.ticketId,
    tableName: TABLE.scheduledCharges,
    operation: 'update',
    oldData: extractOldValues(
      context.oldRecord,
      changedFields as Partial<ScheduledChargeRecord>
    ),
    newData: changedFields as Record<string, unknown>,
  })

  return result.data as ScheduledChargeRecord
}

export async function deleteScheduledCharge(
  chargeId: string,
  context: { ticketId: string; oldRecord: ScheduledChargeRecord }
): Promise<void> {
  await Crc5c_copyscheduledchargesesService.delete(chargeId)

  writeChangeLog({
    ticketId: context.ticketId,
    tableName: TABLE.scheduledCharges,
    operation: 'delete',
    oldData: context.oldRecord as unknown as Record<string, unknown>,
    newData: null,
  })
}

export async function createManualCharge(
  input: ManualChargeCreateInput
): Promise<void> {
  const result = await Crc5c_manualchargesesService.create(
    input as Parameters<typeof Crc5c_manualchargesesService.create>[0]
  )

  if (!result.success) {
    throw new Error(
      result.error?.message || 'Failed to create manual charge'
    )
  }

  // Also create a corresponding Scheduled Charge record
  const chargeCodeName = input.cr109_chargecode !== undefined
    ? Crc5c_manualchargesescr109_chargecode[input.cr109_chargecode]
    : undefined

  const scheduledPayload = {
    crc5c_ticketid: input.crc5c_ticketid,
    cr109_chargecode: chargeCodeName,
    cr109_chargeamount: input.cr109_amount,
    cr109_chargefrom: input.cr109_datefrom,
    cr109_chargeto: input.cr109_dateto,
    cr109_move: true,
    cr109_manual: true,
    cr109_partiallypaid: false,
  }

  const scheduledResult = await Crc5c_copyscheduledchargesesService.create(
    scheduledPayload as unknown as Parameters<typeof Crc5c_copyscheduledchargesesService.create>[0]
  )

  if (!scheduledResult.success) {
    throw new Error(
      scheduledResult.error?.message || 'Failed to create scheduled charge record'
    )
  }

  const ticketId = input.crc5c_ticketid ?? ''

  writeChangeLog({
    ticketId,
    tableName: TABLE.manualCharges,
    operation: 'create',
    oldData: null,
    newData: input as Record<string, unknown>,
  })

  writeChangeLog({
    ticketId,
    tableName: TABLE.scheduledCharges,
    operation: 'create',
    oldData: null,
    newData: scheduledPayload as Record<string, unknown>,
  })
}
