import { describe, expect, it } from 'vitest'
import { toPayload, validateForm } from './NewOwnerTicketTab'
import { newOwnerTicketFixtures } from '../../../test/fixtures/newOwnerTicketFormStates'

const EMAIL_PHONE_FIELDS = [
  'cr7de_primaryowneremail',
  'cr7de_primaryphonenumber',
  'cr109_primaryhomephonenumber',
  'cr109_primaryworkphonenumber',
  'cr7de_secondaryowneremail',
  'cr7de_secondaryphonenumber',
  'cr109_secondaryownerhomephonenumber',
  'cr109_secondaryownerworkphonenumber',
  'cr7de_sellercontactemail',
  'cr7de_sellercontactnumber',
] as const

const NAME_SSN_ADDRESS_FIELDS = [
  'cr7de_newprimaryownername',
  'cr7de_primaryownerssnein',
  'cr7de_newsecondaryownername',
  'cr7de_secondaryownerssnein',
  'cr7de_sellername',
  'cr7de_sellerssnein',
  'cr109_seller2name',
  'cr109_seller2ssnein',
] as const

/**
 * Data-driven regression suite: every fixture in newOwnerTicketFormStates.ts
 * (representing a real shape the New Owner Ticket form can be in for an
 * existing ticket) is run automatically through the actual validateForm and
 * toPayload logic. Add a fixture there to add coverage here — no new test
 * code required.
 */
describe.each(newOwnerTicketFixtures)(
  'existing ticket fixture: $name',
  ({ formState, expectedErrorFields }) => {
    it('validateForm flags exactly the expected fields', () => {
      const errors = validateForm(formState)
      expect(Object.keys(errors).sort()).toEqual(
        [...expectedErrorFields].sort()
      )
    })

    it('toPayload never crashes and never leaves an email/phone field as N/A', () => {
      const payload = toPayload(formState, false)
      for (const field of EMAIL_PHONE_FIELDS) {
        expect(payload[field]).not.toBe('N/A')
      }
    })

    if (expectedErrorFields.length === 0) {
      it('toPayload never leaves a name/SSN/seller-address field blank once saved', () => {
        const payload = toPayload(formState, false)
        for (const field of NAME_SSN_ADDRESS_FIELDS) {
          expect(payload[field]).toBeTruthy()
        }
      })
    }
  }
)
