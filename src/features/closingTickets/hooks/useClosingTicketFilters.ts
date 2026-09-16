import { useMemo, useState } from 'react'
import { filterClosingTickets } from '../utils/closingTicketFilters'
import type {
  ClosingTicketFilters,
  ClosingTicketRecord,
} from '../types/closingTicket'

const defaultFilters: ClosingTicketFilters = {
  status: 'All',
  search: '',
  documentFilter: '',
  chargesFilter: '',
}

export function useClosingTicketFilters(
  records: ClosingTicketRecord[],
  currentUser?: { userName?: string | null; userId?: string | null },
  ticketIdsWithCharges?: Set<string>
) {
  const [filters, setFilters] =
    useState<ClosingTicketFilters>(defaultFilters)

  const filteredRecords = useMemo(
    () =>
      filterClosingTickets(
        records,
        filters,
        currentUser,
        ticketIdsWithCharges
      ),
    [records, filters, currentUser, ticketIdsWithCharges]
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

  const setDocumentFilter = (documentFilter: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      documentFilter,
    }))
  }

  const setChargesFilter = (
    chargesFilter: ClosingTicketFilters['chargesFilter']
  ) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      chargesFilter,
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
    setDocumentFilter,
    setChargesFilter,
    clearFilters,
  }
}
