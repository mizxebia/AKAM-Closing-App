import { Cr7de_closingticketdetailsesService } from '../generated'
import type { ClosingTicketRecord } from '../types/closingTicket'

export const getClosingTickets = async (): Promise<ClosingTicketRecord[]> => {
  const response =
    await Cr7de_closingticketdetailsesService.getAll()

  console.log('Dataverse raw response:', response)

  if (!response.success) {
    throw new Error(
      response.error?.message ||
        'Failed to fetch records'
    )
  }

  return (response.data ?? []) as ClosingTicketRecord[]
}