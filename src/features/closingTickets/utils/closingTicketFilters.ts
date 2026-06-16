import { formatClosingTicketStatus } from './closingTicketFormatters'
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
    if (!currentUser) return true
    // Try matching by user ID first (most reliable)
    if (currentUser.userId && record._createdby_value) {
      return record._createdby_value.toLowerCase() === currentUser.userId.toLowerCase()
    }
    // Fallback to name comparison
    if (currentUser.userName && record.createdbyname) {
      return record.createdbyname.toLowerCase().includes(currentUser.userName.toLowerCase())
    }
    return true
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
