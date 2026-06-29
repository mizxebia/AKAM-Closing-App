import { Cr7de_newownerticketdetailsesService } from '../../../generated'
import type { Cr7de_newownerticketdetailses } from '../../../generated/models/Cr7de_newownerticketdetailsesModel'
import type {
  NewOwnerTicketInput,
  NewOwnerTicketRecord,
} from '../types/newOwnerTicket'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import { buildNewOwnerPayloadFromClosingTicket } from '../utils/sharedTicketFields'
import {
  writeChangeLog,
  extractOldValues,
} from '../../auditLog/api/auditLogService'

const TABLE_NAME = 'cr7de_newownerticketdetailses'

function escapeODataString(value: string) {
  return value.replace(/'/g, "''")
}

export async function getNewOwnerTicketByTicketId(
  ticketId: string
) {
  if (!ticketId.trim()) {
    return null
  }

  const response =
    await Cr7de_newownerticketdetailsesService.getAll({
      filter: `cr7de_ticketid eq '${escapeODataString(
        ticketId
      )}'`,
      top: 1,
    })

  if (!response.success) {
    throw new Error(
      response.error?.message ||
        'Failed to load new owner ticket details'
    )
  }

  return (response.data?.[0] ??
    null) as NewOwnerTicketRecord | null
}

export async function saveNewOwnerTicket(
  existingRecordId: string | null,
  payload: NewOwnerTicketInput,
  oldRecord?: NewOwnerTicketRecord
) {
  const ticketId = payload.cr7de_ticketid ?? existingRecordId ?? ''

  if (existingRecordId) {
    const result =
      await Cr7de_newownerticketdetailsesService.update(
        existingRecordId,
        payload
      )

    if (!result.success) {
      throw new Error(
        result.error?.message ||
          'Failed to update new owner ticket'
      )
    }

    writeChangeLog({
      ticketId,
      tableName: TABLE_NAME,
      operation: 'update',
      oldData: oldRecord
        ? extractOldValues(oldRecord, payload as Partial<NewOwnerTicketRecord>)
        : null,
      newData: payload as Record<string, unknown>,
    })

    return result.data as NewOwnerTicketRecord
  }

  const result =
    await Cr7de_newownerticketdetailsesService.create(
      payload as Omit<
        Cr7de_newownerticketdetailses,
        'cr7de_newownerticketdetailsid'
      >
    )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to create new owner ticket'
    )
  }

  writeChangeLog({
    ticketId,
    tableName: TABLE_NAME,
    operation: 'create',
    oldData: null,
    newData: payload as Record<string, unknown>,
  })

  return result.data as NewOwnerTicketRecord
}

export async function ensureNewOwnerTicketForClosingTicket(
  closingTicket: ClosingTicketRecord
) {
  const ticketId = closingTicket.cr7de_ticketid ?? ''
  if (!ticketId.trim()) {
    return null
  }

  const existingRecord =
    await getNewOwnerTicketByTicketId(ticketId)

  if (existingRecord) {
    return existingRecord
  }

  return saveNewOwnerTicket(
    null,
    buildNewOwnerPayloadFromClosingTicket(closingTicket)
  )
}

export async function syncNewOwnerTicketFromClosingTicket(
  closingTicket: ClosingTicketRecord
) {
  const ticketId = closingTicket.cr7de_ticketid ?? ''
  if (!ticketId.trim()) {
    return null
  }

  const existingRecord =
    await getNewOwnerTicketByTicketId(ticketId)

  return saveNewOwnerTicket(
    existingRecord?.cr7de_newownerticketdetailsid ?? null,
    buildNewOwnerPayloadFromClosingTicket(closingTicket)
  )
}
