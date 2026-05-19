import { Cr7de_newownerticketdetailsesService } from '../../../generated'
import type { Cr7de_newownerticketdetailses } from '../../../generated/models/Cr7de_newownerticketdetailsesModel'
import type {
  NewOwnerTicketInput,
  NewOwnerTicketRecord,
} from '../types/newOwnerTicket'

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
  payload: NewOwnerTicketInput
) {
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

  return result.data as NewOwnerTicketRecord
}
