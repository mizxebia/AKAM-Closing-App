import { useMemo, useState } from 'react'
import { filterClosingTickets } from '../utils/closingTicketFilters'
import type {
  ClosingTicketFilters,
  ClosingTicketRecord,
} from '../types/closingTicket'

const defaultFilters: ClosingTicketFilters = {
  status: 'All',
  search: '',
}

export function useClosingTicketFilters(
  records: ClosingTicketRecord[],
  currentUser?: { userName?: string | null; userId?: string | null }
) {
  const [filters, setFilters] =
    useState<ClosingTicketFilters>(defaultFilters)

  const filteredRecords = useMemo(
    () => filterClosingTickets(records, filters, currentUser),
    [records, filters, currentUser]
  )

  const setStatus = (
    status: ClosingTicketFilters['status']
  ) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      status,
    }))
  }

  const setSearch = (search: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      search,
    }))
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  return {
    filters,
    filteredRecords,
    setStatus,
    setSearch,
    clearFilters,
  }
}
