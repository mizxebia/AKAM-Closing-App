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
  filters: ClosingTicketFilters
) {
  if (filters.status === 'All') {
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
  filters: ClosingTicketFilters
) {
  return records.filter(
    (record) =>
      matchesStatus(record, filters) &&
      matchesGeneralSearch(record, filters.search)
  )
}
