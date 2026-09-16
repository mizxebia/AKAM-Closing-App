import type { ClosingTicketRecord } from '../types/closingTicket'

const PROCESSING_STATUS = 716070005
const READY_FOR_POST_CLOSING_STATUS = 716070006

type MissingParty = 'buyer' | 'seller' | 'both'

function getMissingParty(
  record: ClosingTicketRecord
): MissingParty | null {
  const missingBuyer = !record.cr7de_buyername?.trim()
  const missingSeller = !record.cr7de_sellername?.trim()

  if (!missingBuyer && !missingSeller) {
    return null
  }

  if (missingBuyer && missingSeller) {
    return 'both'
  }

  return missingBuyer ? 'buyer' : 'seller'
}

function buildMissingPartyMessage(missing: MissingParty) {
  const subject =
    missing === 'both'
      ? 'Buyer and seller names'
      : missing === 'buyer'
        ? 'Buyer name'
        : 'Seller name'

  return `${subject} might not be available in the Domecile dump. Please enter it manually.`
}

/**
 * Lenient, inline reminder for the ticket details page — only surfaced once
 * a closing has actually reached Processing or Ready for Post Closing (the
 * stages where the Domecile dump would normally have populated these
 * fields), so it doesn't fire on tickets still in Draft.
 */
export function getMissingPartyNamesBannerMessage(
  record: ClosingTicketRecord
): string | null {
  const status = Number(record.cr7de_ticketstatus)
  if (
    status !== PROCESSING_STATUS &&
    status !== READY_FOR_POST_CLOSING_STATUS
  ) {
    return null
  }

  const missing = getMissingParty(record)
  return missing ? buildMissingPartyMessage(missing) : null
}

/**
 * Same underlying check, but for the Generate Invoice confirmation prompt —
 * this one isn't gated by ticket status, since an invoice can be (re)generated
 * at other stages too and the missing-name risk is the same regardless.
 */
export function getMissingPartyNamesInvoiceWarning(
  record: ClosingTicketRecord
): string | null {
  const missing = getMissingParty(record)
  return missing ? buildMissingPartyMessage(missing) : null
}
