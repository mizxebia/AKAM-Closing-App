import { describe, expect, it } from 'vitest'
import {
  findTicketsNeedingAutoArchive,
  isEffectivelyArchived,
  isPastArchiveWindow,
} from './closingTicketArchiving'
import type { ClosingTicketRecord } from '../types/closingTicket'

const SENT_TO_AR_STATUS = 396620001
const COMPLETED_STATUS = 716070008
const DRAFT_STATUS = 716070000

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function record(
  overrides: Partial<ClosingTicketRecord> & Record<string, unknown>
): ClosingTicketRecord {
  return {
    cr7de_closingticketdetailsid: 'closing-0000',
    cr7de_ticketid: 'CT-0000',
    cr7de_ticketstatus: DRAFT_STATUS,
    modifiedon: daysAgo(1),
    ...overrides,
  } as unknown as ClosingTicketRecord
}

describe('isPastArchiveWindow', () => {
  it('is false for a Sent to AR ticket within 10 days', () => {
    const r = record({
      cr7de_ticketstatus: SENT_TO_AR_STATUS,
      modifiedon: daysAgo(5),
    })
    expect(isPastArchiveWindow(r)).toBe(false)
  })

  it('is true for a Sent to AR ticket older than 10 days', () => {
    const r = record({
      cr7de_ticketstatus: SENT_TO_AR_STATUS,
      modifiedon: daysAgo(11),
    })
    expect(isPastArchiveWindow(r)).toBe(true)
  })

  it('is false for a Completed ticket within 15 days', () => {
    const r = record({
      cr7de_ticketstatus: COMPLETED_STATUS,
      modifiedon: daysAgo(10),
    })
    expect(isPastArchiveWindow(r)).toBe(false)
  })

  it('is true for a Completed ticket older than 15 days', () => {
    const r = record({
      cr7de_ticketstatus: COMPLETED_STATUS,
      modifiedon: daysAgo(16),
    })
    expect(isPastArchiveWindow(r)).toBe(true)
  })

  it('is false for any other status regardless of age', () => {
    const r = record({
      cr7de_ticketstatus: DRAFT_STATUS,
      modifiedon: daysAgo(365),
    })
    expect(isPastArchiveWindow(r)).toBe(false)
  })
})

describe('isEffectivelyArchived', () => {
  it('is true when the archival flag is already set, even if recent', () => {
    const r = record({
      cr109_archivalstatus: true,
      modifiedon: daysAgo(0),
    })
    expect(isEffectivelyArchived(r)).toBe(true)
  })

  it('is true when past the age window even if the flag is unset', () => {
    const r = record({
      cr7de_ticketstatus: COMPLETED_STATUS,
      modifiedon: daysAgo(20),
    })
    expect(isEffectivelyArchived(r)).toBe(true)
  })

  it('is false for a fresh, unflagged ticket', () => {
    const r = record({
      cr7de_ticketstatus: COMPLETED_STATUS,
      modifiedon: daysAgo(1),
    })
    expect(isEffectivelyArchived(r)).toBe(false)
  })
})

describe('findTicketsNeedingAutoArchive', () => {
  it('returns only tickets past their window that are not already flagged', () => {
    const stale = record({
      cr7de_closingticketdetailsid: 'stale',
      cr7de_ticketstatus: COMPLETED_STATUS,
      modifiedon: daysAgo(20),
    })
    const alreadyFlagged = record({
      cr7de_closingticketdetailsid: 'already-flagged',
      cr7de_ticketstatus: COMPLETED_STATUS,
      modifiedon: daysAgo(20),
      cr109_archivalstatus: true,
    })
    const fresh = record({
      cr7de_closingticketdetailsid: 'fresh',
      cr7de_ticketstatus: COMPLETED_STATUS,
      modifiedon: daysAgo(1),
    })

    const result = findTicketsNeedingAutoArchive([
      stale,
      alreadyFlagged,
      fresh,
    ])

    expect(result.map((r) => r.cr7de_closingticketdetailsid)).toEqual([
      'stale',
    ])
  })
})
