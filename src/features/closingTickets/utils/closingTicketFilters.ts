import { formatClosingTicketStatus, CREATED_BY_DISPLAY_ANNOTATION } from './closingTicketFormatters'
import {
  AR_TEAM_DOCUMENTS,
  GENERATED_CLOSING_DOCUMENTS,
  NEW_OWNER_DOCUMENTS,
  hasDocument,
  type NewOwnerDocumentDefinition,
} from '../../newOwnerTickets/utils/dataverseFileUtils'
import { formatGeneratedLabel } from '../../invoices/utils/invoiceFormatters'
import { BOT_STATUS_OPTIONS } from '../../devTools/utils/statusOptions'
import type {
  ClosingTicketFilters,
  ClosingTicketRecord,
} from '../types/closingTicket'

// The three document lists overlap (e.g. the Invoice PDF is both a
// "generated closing document" and an "AR team document") — dedupe by key
// so the dashboard's document filter offers each real document exactly once.
const CLOSING_DOCUMENTS: NewOwnerDocumentDefinition[] = (() => {
  const byKey = new Map<string, NewOwnerDocumentDefinition>()
  for (const doc of [
    ...NEW_OWNER_DOCUMENTS,
    ...GENERATED_CLOSING_DOCUMENTS,
    ...AR_TEAM_DOCUMENTS,
  ]) {
    if (!byKey.has(doc.key)) {
      byKey.set(doc.key, doc)
    }
  }
  return Array.from(byKey.values())
})()

/** Options for the developer-mode "Documents" filter dropdown. */
export const CLOSING_DOCUMENT_FILTER_OPTIONS: {
  value: string
  label: string
}[] = CLOSING_DOCUMENTS.flatMap((doc) => [
  { value: `${doc.key}|present`, label: `Has ${doc.label}` },
  { value: `${doc.key}|missing`, label: `Missing ${doc.label}` },
])

function matchesDocumentFilter(
  record: ClosingTicketRecord,
  documentFilter: string
) {
  if (!documentFilter) {
    return true
  }

  const [key, presence] = documentFilter.split('|')
  const document = CLOSING_DOCUMENTS.find((doc) => doc.key === key)

  if (!document) {
    return true
  }

  const present = hasDocument(record, document)
  return presence === 'present' ? present : !present
}

/** Options for the developer-mode "Bot Status" filter dropdown. */
export const BOT_STATUS_FILTER_OPTIONS: {
  value: number
  label: string
}[] = BOT_STATUS_OPTIONS.map((option) => ({
  value: option.value,
  label: formatGeneratedLabel(option.label),
}))

function matchesBotStatusFilter(
  record: ClosingTicketRecord,
  botStatusFilter: ClosingTicketFilters['botStatusFilter']
) {
  if (!botStatusFilter) {
    return true
  }

  return Number(record.cr109_botstatus) === botStatusFilter
}

function matchesChargesFilter(
  record: ClosingTicketRecord,
  chargesFilter: ClosingTicketFilters['chargesFilter'],
  ticketIdsWithCharges: Set<string>
) {
  if (!chargesFilter) {
    return true
  }

  const ticketId = record.cr7de_ticketid?.trim()
  const present = !!ticketId && ticketIdsWithCharges.has(ticketId)
  return chargesFilter === 'present' ? present : !present
}

const excludedSearchFields = new Set([
  'createdon',
  'modifiedon',
  'cr7de_closingdate',
])

function matchesGeneralSearch(
  record: ClosingTicketRecord,
  searchValue: string
) {
  const normalizedSearchValue = searchValue
    .trim()
    .toLowerCase()

  if (!normalizedSearchValue) {
    return true
  }

  if (
    formatClosingTicketStatus(record.cr7de_ticketstatus)
      .toLowerCase()
      .includes(normalizedSearchValue)
  ) {
    return true
  }

  return Object.entries(record).some(([key, value]) => {
    if (
      excludedSearchFields.has(key) ||
      value === undefined ||
      value === null
    ) {
      return false
    }

    return String(value)
      .toLowerCase()
      .includes(normalizedSearchValue)
  })
}

function matchesStatus(
  record: ClosingTicketRecord,
  filters: ClosingTicketFilters,
  currentUser?: { userName?: string | null; userId?: string | null }
) {
  if (filters.status === 'All') {
    return true
  }

  if (filters.status === 'My Tickets') {
    if (!currentUser) return false

    const userId   = currentUser.userId?.toLowerCase() ?? ''
    const userName = currentUser.userName?.trim().toLowerCase() ?? ''
    const raw      = record as unknown as Record<string, unknown>

    // Primary: OData display name annotation — confirmed working in debug.
    // FormattedValue is "AkamBotDev1 #" — strip trailing " #" before comparing.
    const formattedValue = raw[CREATED_BY_DISPLAY_ANNOTATION]
    if (userName && typeof formattedValue === 'string' && formattedValue) {
      const stored = formattedValue.replace(/\s*#\s*$/, '').trim().toLowerCase()
      return stored === userName
    }

    // Secondary: GUID match — objectId vs _createdby_value
    if (userId && record._createdby_value) {
      return record._createdby_value.toLowerCase() === userId
    }

    return false
  }

  return (
    formatClosingTicketStatus(
      record.cr7de_ticketstatus
    ) === filters.status
  )
}

export function filterClosingTickets(
  records: ClosingTicketRecord[],
  filters: ClosingTicketFilters,
  currentUser?: { userName?: string | null; userId?: string | null },
  ticketIdsWithCharges: Set<string> = new Set()
) {
  return records.filter(
    (record) =>
      matchesStatus(record, filters, currentUser) &&
      matchesGeneralSearch(record, filters.search) &&
      matchesDocumentFilter(record, filters.documentFilter) &&
      matchesChargesFilter(
        record,
        filters.chargesFilter,
        ticketIdsWithCharges
      ) &&
      matchesBotStatusFilter(record, filters.botStatusFilter)
  )
}
