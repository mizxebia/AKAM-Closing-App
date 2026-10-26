import type { ClosingTicketRecord } from '../types/closingTicket'

// Ticket Status option-set values (see Cr7de_closingticketdetailsescr7de_ticketstatus).
const SENT_TO_AR_STATUS = 396620001
const COMPLETED_STATUS = 716070008

/** Days a ticket may sit in each terminal status before it auto-archives. */
export const SENT_TO_AR_ARCHIVE_AFTER_DAYS = 10
export const COMPLETED_ARCHIVE_AFTER_DAYS = 15

const MS_PER_DAY = 24 * 60 * 60 * 1000

function daysSince(dateString: string | undefined): number | null {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return (Date.now() - date.getTime()) / MS_PER_DAY
}

/**
 * Whether a ticket has aged past the auto-archive window for its current
 * status. Age is measured from `modifiedon` — there's no dedicated
 * per-status-transition timestamp available without mining the full audit
 * log, so this is an approximation: the last modification on a terminal-
 * status ticket is usually the transition into that status itself, since
 * nothing else touches it afterward.
 */
export function isPastArchiveWindow(
  record: ClosingTicketRecord
): boolean {
  const status = Number(record.cr7de_ticketstatus)
  const age = daysSince(record.modifiedon)

  if (age === null) return false

  if (status === SENT_TO_AR_STATUS) {
    return age > SENT_TO_AR_ARCHIVE_AFTER_DAYS
  }

  if (status === COMPLETED_STATUS) {
    return age > COMPLETED_ARCHIVE_AFTER_DAYS
  }

  return false
}

/**
 * Whether a ticket should be treated as archived right now — either it's
 * explicitly flagged (cr109_archivalstatus = true, set manually in
 * Developer Mode or previously by the auto-archive sweep) or it has aged
 * past its status's archive window and simply hasn't been flagged yet.
 * Used for display filtering so a ticket disappears from the main list
 * immediately once it ages out, without waiting for the flag to persist.
 */
export function isEffectivelyArchived(
  record: ClosingTicketRecord
): boolean {
  return (
    record.cr109_archivalstatus === true ||
    isPastArchiveWindow(record)
  )
}

/**
 * Tickets that have aged past their archive window but aren't flagged
 * `cr109_archivalstatus = true` in Dataverse yet — the set the auto-archive
 * sweep should persist the flag for.
 */
export function findTicketsNeedingAutoArchive(
  records: ClosingTicketRecord[]
): ClosingTicketRecord[] {
  return records.filter(
    (record) =>
      record.cr109_archivalstatus !== true &&
      isPastArchiveWindow(record)
  )
}
