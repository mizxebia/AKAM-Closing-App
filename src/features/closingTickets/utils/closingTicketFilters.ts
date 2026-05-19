import { closingTicketSearchFields } from '../constants/closingTicketMetadata'
import { formatClosingTicketStatus } from './closingTicketFormatters'
import type {
  ClosingTicketFilters,
  ClosingTicketRecord,
} from '../types/closingTicket'

function matchesFieldFilter(
  record: ClosingTicketRecord,
  field: (typeof closingTicketSearchFields)[number],
  filterValue: string
) {
  const normalizedFilterValue = filterValue
    .trim()
    .toLowerCase()

  if (!normalizedFilterValue) {
    return true
  }

  const value = record[field]

  return String(value ?? '')
    .toLowerCase()
    .includes(normalizedFilterValue)
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
      matchesFieldFilter(
        record,
        'cr7de_nyccode',
        filters.buildingCode
      ) &&
      matchesFieldFilter(
        record,
        'cr7de_unitnumber',
        filters.unit
      )
  )
}
