import {
  Crc5c_copyscheduledchargesesService,
  Crc5c_unpaidchargesesService,
} from '../../../generated'
import type {
  ScheduledChargeRecord,
  ScheduledChargeUpdateInput,
  UnpaidChargeRecord,
  UnpaidChargeUpdateInput,
} from '../types/charges'

function escapeODataString(value: string) {
  return value.replace(/'/g, "''")
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
