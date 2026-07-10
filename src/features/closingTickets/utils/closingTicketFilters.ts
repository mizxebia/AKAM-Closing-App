import { formatClosingTicketStatus, CREATED_BY_DISPLAY_ANNOTATION } from './closingTicketFormatters'
import type {
  ClosingTicketFilters,
  ClosingTicketRecord,
} from '../types/closingTicket'

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
  currentUser?: { userName?: string | null; userId?: string | null }
) {
  return records.filter(
    (record) =>
      matchesStatus(record, filters, currentUser) &&
      matchesGeneralSearch(record, filters.search)
  )
}
