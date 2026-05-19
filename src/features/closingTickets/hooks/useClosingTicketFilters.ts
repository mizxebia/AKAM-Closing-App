import { useMemo, useState } from 'react'
import { filterClosingTickets } from '../utils/closingTicketFilters'
import type {
  ClosingTicketFilters,
  ClosingTicketRecord,
} from '../types/closingTicket'

const defaultFilters: ClosingTicketFilters = {
  status: 'All',
  buildingCode: '',
  unit: '',
}

export function useClosingTicketFilters(
  records: ClosingTicketRecord[]
) {
  const [filters, setFilters] =
    useState<ClosingTicketFilters>(defaultFilters)

  const filteredRecords = useMemo(
    () => filterClosingTickets(records, filters),
    [records, filters]
  )

  const setStatus = (
    status: ClosingTicketFilters['status']
  ) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      status,
    }))
  }

  const setBuildingCode = (buildingCode: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      buildingCode,
    }))
  }

  const setUnit = (unit: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      unit,
    }))
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  return {
    filters,
    filteredRecords,
    setStatus,
    setBuildingCode,
    setUnit,
    clearFilters,
  }
}
