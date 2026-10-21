import { describe, expect, it } from 'vitest'
import { normalizePartyName } from './CreateClosingTicketForm'

describe('normalizePartyName', () => {
  it('replaces empty or whitespace-only names with N/A', () => {
    expect(normalizePartyName('')).toBe('N/A')
    expect(normalizePartyName('   ')).toBe('N/A')
  })

  it('trims names that were provided', () => {
    expect(normalizePartyName('  Jamie Seller  ')).toBe(
      'Jamie Seller'
    )
  })
})
