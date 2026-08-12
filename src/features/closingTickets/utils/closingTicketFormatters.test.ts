import { describe, expect, it } from 'vitest'
import {
  formatClosingTicketDate,
  formatClosingTicketStatus,
  formatClosingTicketValue,
  getClosingTicketStatusDisplay,
  isClosingTicketStatusLabel,
} from './closingTicketFormatters'
import { closingTicketFixtures } from '../../../test/fixtures/closingTickets'

describe('formatClosingTicketStatus / getClosingTicketStatusDisplay', () => {
  it('maps every known status code to a human label and tone', () => {
    expect(getClosingTicketStatusDisplay(716070000)).toEqual({
      label: 'Draft',
      tone: 'draft',
    })
    expect(getClosingTicketStatusDisplay(716070008)).toEqual({
      label: 'Completed',
      tone: 'completed',
    })
    expect(getClosingTicketStatusDisplay(716070007)).toEqual({
      label: 'Failed',
      tone: 'failed',
    })
  })

  it('falls back to "-" / default tone for missing status', () => {
    expect(getClosingTicketStatusDisplay(undefined)).toEqual({
      label: '-',
      tone: 'default',
    })
  })

  it('formatClosingTicketStatus returns just the label', () => {
    expect(formatClosingTicketStatus(716070000)).toBe('Draft')
  })
})

describe('formatClosingTicketDate', () => {
  it('returns "-" for a missing value', () => {
    expect(formatClosingTicketDate(undefined)).toBe('-')
  })

  it('formats a valid ISO date string', () => {
    const formatted = formatClosingTicketDate('2026-01-05T10:00:00Z')
    expect(formatted).not.toBe('-')
    expect(formatted).not.toBe('2026-01-05T10:00:00Z')
  })

  it('returns the raw value when it cannot be parsed as a date', () => {
    expect(formatClosingTicketDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatClosingTicketValue', () => {
  const ticket = closingTicketFixtures[0]

  it('returns "-" for undefined/null/empty fields', () => {
    expect(
      formatClosingTicketValue(
        { ...ticket, cr7de_buildingname: undefined },
        'cr7de_buildingname'
      )
    ).toBe('-')
  })

  it('formats the status column through the status label map', () => {
    expect(
      formatClosingTicketValue(ticket, 'cr7de_ticketstatus')
    ).toBe('Draft')
  })

  it('formats date columns through formatClosingTicketDate', () => {
    expect(formatClosingTicketValue(ticket, 'createdon')).not.toBe(
      ticket.createdon
    )
  })

  it('reads createdbyname from the OData display-name annotation', () => {
    expect(formatClosingTicketValue(ticket, 'createdbyname')).toBe(
      'Test User'
    )
  })

  it('returns "-" for createdbyname when the annotation is absent', () => {
    const withoutAnnotation = { ...ticket } as Record<string, unknown>
    delete withoutAnnotation[
      '_createdby_value@OData.Community.Display.V1.FormattedValue'
    ]
    expect(
      formatClosingTicketValue(
        withoutAnnotation as unknown as typeof ticket,
        'createdbyname'
      )
    ).toBe('-')
  })
})

describe('isClosingTicketStatusLabel', () => {
  it('accepts known status labels', () => {
    expect(isClosingTicketStatusLabel('Draft')).toBe(true)
    expect(isClosingTicketStatusLabel('Completed')).toBe(true)
  })

  it('rejects "All" and "My Tickets" (tabs, not status labels)', () => {
    expect(isClosingTicketStatusLabel('All')).toBe(false)
    expect(isClosingTicketStatusLabel('My Tickets')).toBe(false)
  })

  it('rejects unknown strings', () => {
    expect(isClosingTicketStatusLabel('Not A Status')).toBe(false)
  })
})
