import type { ClosingTicketRecord } from '../types/closingTicket'

export const FAILED_TICKET_STATUS = 716070007

const BOT_STATUS_FAILURE_REASONS: Record<number, string> = {
  396620005: 'Seller information could not be retrieved from the source system.',
  396620008: 'The purchase application form failed to download.',
  396620009: 'The Domicile dump could not be retrieved.',
  396620012: 'YARDI charges could not be fetched.',
  396620014: 'Purchase form data extraction failed.',
  396620016: 'Purchase form could not be uploaded to OneDrive.',
  396620017: 'Seller details update failed.',
  396620018: 'New owner record could not be created.',
  396620019: 'RPTT document extraction failed.',
}

/** Returns null when the ticket isn't Failed — only Failed tickets have a reason. */
export function getFailureReason(
  record: ClosingTicketRecord
): string | null {
  if (Number(record.cr7de_ticketstatus) !== FAILED_TICKET_STATUS) {
    return null
  }
  const botStatus = Number(record.cr109_botstatus)
  return (
    BOT_STATUS_FAILURE_REASONS[botStatus] ??
    'An unexpected error occurred during processing.'
  )
}
