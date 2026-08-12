import { describe, expect, it } from 'vitest'
import { filterClosingTickets } from './closingTicketFilters'
import { closingTicketFixtures } from '../../../test/fixtures/closingTickets'

describe('filterClosingTickets', () => {
  it('returns every fixture ticket for the "All" tab with no search', () => {
    const result = filterClosingTickets(closingTicketFixtures, {
      status: 'All',
      search: '',
    })
    expect(result).toHaveLength(closingTicketFixtures.length)
  })

  it('filters by status label', () => {
    const result = filterClosingTickets(closingTicketFixtures, {
      status: 'Draft',
      search: '',
    })
    expect(result.every((r) => r.cr7de_ticketstatus === 716070000)).toBe(
      true
    )
    expect(result.length).toBeGreaterThan(0)
  })

  it('filters "My Tickets" by the current user\'s created-by annotation', () => {
    const result = filterClosingTickets(
      closingTicketFixtures,
      { status: 'My Tickets', search: '' },
      { userName: 'Current User', userId: 'current-user-guid' }
    )
    expect(result).toHaveLength(1)
    expect(result[0].cr7de_ticketid).toBe('CT-1005')
  })

  it('"My Tickets" returns nothing when no current user is supplied', () => {
    const result = filterClosingTickets(closingTicketFixtures, {
      status: 'My Tickets',
      search: '',
    })
    expect(result).toHaveLength(0)
  })

  it('searches across building name, unit, and ticket id case-insensitively', () => {
    const result = filterClosingTickets(closingTicketFixtures, {
      status: 'All',
      search: 'riverside',
    })
    expect(result).toHaveLength(1)
    expect(result[0].cr7de_ticketid).toBe('CT-1002')
  })

  it('search also matches against the formatted status label', () => {
    const result = filterClosingTickets(closingTicketFixtures, {
      status: 'All',
      search: 'validate closings',
    })
    expect(result.some((r) => r.cr7de_ticketid === 'CT-1002')).toBe(true)
  })

  it('combines status and search filters', () => {
    const result = filterClosingTickets(closingTicketFixtures, {
      status: 'Completed',
      search: 'harbor',
    })
    expect(result).toHaveLength(1)
    expect(result[0].cr7de_ticketid).toBe('CT-1003')
  })

  it('returns nothing when the search matches no ticket', () => {
    const result = filterClosingTickets(closingTicketFixtures, {
      status: 'All',
      search: 'no-such-building-xyz',
    })
    expect(result).toHaveLength(0)
  })
})
