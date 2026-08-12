import { describe, expect, it } from 'vitest'
import {
  normalizeText,
  toPayload,
  validateForm,
} from './NewOwnerTicketTab'
import { baseFormState } from '../../../test/fixtures/newOwnerTicketFormStates'

describe('normalizeText', () => {
  it('trims whitespace-only values to undefined', () => {
    expect(normalizeText('   ')).toBeUndefined()
    expect(normalizeText('')).toBeUndefined()
  })

  it('trims surrounding whitespace from real values', () => {
    expect(normalizeText('  Alex Buyer  ')).toBe('Alex Buyer')
  })
})

describe('validateForm', () => {
  it('requires ticket id and unit', () => {
    const errors = validateForm(
      baseFormState({ cr7de_ticketid: '', cr7de_unit: '' })
    )
    expect(errors.cr7de_ticketid).toBeDefined()
    expect(errors.cr7de_unit).toBeDefined()
  })

  it('accepts blank buyer/seller emails (left empty is valid)', () => {
    const errors = validateForm(
      baseFormState({
        cr7de_primaryowneremail: '',
        cr7de_secondaryowneremail: '',
        cr7de_sellercontactemail: '',
      })
    )
    expect(errors.cr7de_primaryowneremail).toBeUndefined()
    expect(errors.cr7de_secondaryowneremail).toBeUndefined()
    expect(errors.cr7de_sellercontactemail).toBeUndefined()
  })

  it('flags malformed emails that contain an "@"', () => {
    const errors = validateForm(
      baseFormState({ cr7de_primaryowneremail: 'not-an-email@' })
    )
    expect(errors.cr7de_primaryowneremail).toBe(
      'Enter a valid email address.'
    )
  })

  it('does not require buyer 1/2 address fields while occupancy is Present', () => {
    const errors = validateForm(
      baseFormState({
        cr109_purchaser1occupancy: 'Present',
        cr109_purchaser2occupancy: 'Present',
      })
    )
    expect(errors.cr109_buyer1address).toBeUndefined()
    expect(errors.cr109_buyer2address).toBeUndefined()
  })

  it('requires the buyer 1 mailing address once occupancy is Absent', () => {
    const errors = validateForm(
      baseFormState({ cr109_purchaser1occupancy: 'Absent' })
    )
    expect(errors.cr109_buyer1address).toBeDefined()
    expect(errors.cr109_buyer1city).toBeDefined()
    expect(errors.cr109_buyer1state).toBeDefined()
    expect(errors.cr109_buyer1zip).toBeDefined()
  })

  it('requires the buyer 2 mailing address once occupancy is Absent', () => {
    const errors = validateForm(
      baseFormState({ cr109_purchaser2occupancy: 'Absent' })
    )
    expect(errors.cr109_buyer2address).toBeDefined()
    expect(errors.cr109_buyer2city).toBeDefined()
    expect(errors.cr109_buyer2state).toBeDefined()
    expect(errors.cr109_buyer2zip).toBeDefined()
  })

  it('does not flag a buyer 1 Absent address that is actually filled in', () => {
    const errors = validateForm(
      baseFormState({
        cr109_purchaser1occupancy: 'Absent',
        cr109_buyer1address: '9 Forwarding Ave',
        cr109_buyer1city: 'New York',
        cr109_buyer1state: 'NY',
        cr109_buyer1zip: '10003',
      })
    )
    expect(errors.cr109_buyer1address).toBeUndefined()
    expect(errors.cr109_buyer1city).toBeUndefined()
    expect(errors.cr109_buyer1state).toBeUndefined()
    expect(errors.cr109_buyer1zip).toBeUndefined()
  })
})

describe('toPayload — blank name/SSN/address fields default to N/A', () => {
  it('defaults blank buyer 2 name/SSN/address/city/state/zip to N/A', () => {
    const payload = toPayload(
      baseFormState({
        cr7de_newsecondaryownername: '',
        cr7de_secondaryownerssnein: '',
        cr109_buyer2address: '',
        cr109_buyer2city: '',
        cr109_buyer2state: '',
        cr109_buyer2zip: '',
      }),
      false
    )
    expect(payload.cr7de_newsecondaryownername).toBe('N/A')
    expect(payload.cr7de_secondaryownerssnein).toBe('N/A')
    expect(payload.cr109_buyer2address).toBe('N/A')
    expect(payload.cr109_buyer2city).toBe('N/A')
    expect(payload.cr109_buyer2state).toBe('N/A')
    expect(payload.cr109_buyer2zip).toBe('N/A')
  })

  it('defaults blank buyer 1 name/SSN to N/A', () => {
    const payload = toPayload(
      baseFormState({
        cr7de_newprimaryownername: '',
        cr7de_primaryownerssnein: '',
      }),
      false
    )
    expect(payload.cr7de_newprimaryownername).toBe('N/A')
    expect(payload.cr7de_primaryownerssnein).toBe('N/A')
  })

  it('defaults blank seller 1 and seller 2 fields to N/A', () => {
    const payload = toPayload(
      baseFormState({
        cr7de_sellername: '',
        cr7de_sellerssnein: '',
        cr109_seller1address: '',
        cr109_seller1city: '',
        cr109_seller1state: '',
        cr109_seller1zip: '',
        cr109_seller2name: '',
        cr109_seller2ssnein: '',
        cr109_seller2address: '',
        cr109_seller2city: '',
        cr109_seller2state: '',
        cr109_seller2zip: '',
      }),
      false
    )
    expect(payload.cr7de_sellername).toBe('N/A')
    expect(payload.cr7de_sellerssnein).toBe('N/A')
    expect(payload.cr109_seller1address).toBe('N/A')
    expect(payload.cr109_seller1city).toBe('N/A')
    expect(payload.cr109_seller1state).toBe('N/A')
    expect(payload.cr109_seller1zip).toBe('N/A')
    expect(payload.cr109_seller2name).toBe('N/A')
    expect(payload.cr109_seller2ssnein).toBe('N/A')
    expect(payload.cr109_seller2address).toBe('N/A')
    expect(payload.cr109_seller2city).toBe('N/A')
    expect(payload.cr109_seller2state).toBe('N/A')
    expect(payload.cr109_seller2zip).toBe('N/A')
  })

  it('never defaults a blank buyer address to N/A while occupancy is Absent', () => {
    const payload = toPayload(
      baseFormState({
        cr109_purchaser1occupancy: 'Absent',
        cr109_purchaser2occupancy: 'Absent',
      }),
      false
    )
    expect(payload.cr109_buyer1address).toBeUndefined()
    expect(payload.cr109_buyer1city).toBeUndefined()
    expect(payload.cr109_buyer1state).toBeUndefined()
    expect(payload.cr109_buyer1zip).toBeUndefined()
    expect(payload.cr109_buyer2address).toBeUndefined()
    expect(payload.cr109_buyer2city).toBeUndefined()
    expect(payload.cr109_buyer2state).toBeUndefined()
    expect(payload.cr109_buyer2zip).toBeUndefined()
  })

  it('uses the real address once provided, even while occupancy is Absent', () => {
    const payload = toPayload(
      baseFormState({
        cr109_purchaser1occupancy: 'Absent',
        cr109_buyer1address: '9 Forwarding Ave',
        cr109_buyer1city: 'New York',
        cr109_buyer1state: 'NY',
        cr109_buyer1zip: '10003',
      }),
      false
    )
    expect(payload.cr109_buyer1address).toBe('9 Forwarding Ave')
    expect(payload.cr109_buyer1city).toBe('New York')
    expect(payload.cr109_buyer1state).toBe('NY')
    expect(payload.cr109_buyer1zip).toBe('10003')
  })
})

describe('toPayload — email/phone fields are left blank, never N/A', () => {
  it('leaves every blank email/phone field undefined', () => {
    const payload = toPayload(
      baseFormState({
        cr7de_primaryowneremail: '',
        cr7de_primaryphonenumber: '',
        cr109_primaryhomephonenumber: '',
        cr109_primaryworkphonenumber: '',
        cr7de_secondaryowneremail: '',
        cr7de_secondaryphonenumber: '',
        cr109_secondaryownerhomephonenumber: '',
        cr109_secondaryownerworkphonenumber: '',
        cr7de_sellercontactemail: '',
        cr7de_sellercontactnumber: '',
      }),
      false
    )

    expect(payload.cr7de_primaryowneremail).toBeUndefined()
    expect(payload.cr7de_primaryphonenumber).toBeUndefined()
    expect(payload.cr109_primaryhomephonenumber).toBeUndefined()
    expect(payload.cr109_primaryworkphonenumber).toBeUndefined()
    expect(payload.cr7de_secondaryowneremail).toBeUndefined()
    expect(payload.cr7de_secondaryphonenumber).toBeUndefined()
    expect(payload.cr109_secondaryownerhomephonenumber).toBeUndefined()
    expect(payload.cr109_secondaryownerworkphonenumber).toBeUndefined()
    expect(payload.cr7de_sellercontactemail).toBeUndefined()
    expect(payload.cr7de_sellercontactnumber).toBeUndefined()
  })

  it('passes real email/phone values through untouched', () => {
    const payload = toPayload(
      baseFormState({
        cr7de_primaryowneremail: 'alex.buyer@example.com',
        cr7de_primaryphonenumber: '555-0100',
      }),
      false
    )
    expect(payload.cr7de_primaryowneremail).toBe(
      'alex.buyer@example.com'
    )
    expect(payload.cr7de_primaryphonenumber).toBe('555-0100')
  })
})

describe('toPayload — occupant fields (pre-existing behavior)', () => {
  it('still defaults blank additional occupant names to N/A', () => {
    const payload = toPayload(baseFormState(), false)
    expect(payload.cr109_additional_occupants1name).toBe('N/A')
    expect(payload.cr109_additionaloccupant2name).toBe('N/A')
    expect(payload.cr109_additionaloccupant3name).toBe('N/A')
  })
})

describe('toPayload — state fields', () => {
  it('omits statecode/statuscode when includeStateFields is false', () => {
    const payload = toPayload(baseFormState(), false)
    expect(payload.statecode).toBeUndefined()
    expect(payload.statuscode).toBeUndefined()
  })
})
