import { describe, expect, it } from 'vitest'
import {
  getUnconfirmedScheduledCharges,
  isUnconfirmedChargeAmount,
} from './scheduledChargeValidation'
import { scheduledChargeFixtures } from '../../../test/fixtures/charges'

describe('isUnconfirmedChargeAmount', () => {
  it('treats "TBD" (any case/whitespace) as unconfirmed', () => {
    expect(isUnconfirmedChargeAmount('TBD')).toBe(true)
    expect(isUnconfirmedChargeAmount('tbd')).toBe(true)
    expect(isUnconfirmedChargeAmount(' TBD ')).toBe(true)
  })

  it('treats a real amount as confirmed', () => {
    expect(isUnconfirmedChargeAmount('250.00')).toBe(false)
  })

  it('treats a missing amount as confirmed (not TBD)', () => {
    expect(isUnconfirmedChargeAmount(undefined)).toBe(false)
    expect(isUnconfirmedChargeAmount('')).toBe(false)
  })
})

describe('getUnconfirmedScheduledCharges', () => {
  it('returns only charges whose amount is TBD, across the existing-ticket fixture set', () => {
    const unconfirmed = getUnconfirmedScheduledCharges(
      scheduledChargeFixtures
    )
    expect(unconfirmed.map((c) => c.crc5c_copyscheduledchargesid).sort()).toEqual(
      ['charge-tbd-1', 'charge-tbd-lowercase'].sort()
    )
  })

  it('returns an empty array when nothing is unconfirmed', () => {
    expect(getUnconfirmedScheduledCharges([])).toEqual([])
  })
})
