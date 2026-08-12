import { describe, expect, it } from 'vitest'
import {
  buildClosingPayloadFromNewOwnerTicket,
  buildNewOwnerPayloadFromClosingTicket,
} from './sharedTicketFields'

describe('buildNewOwnerPayloadFromClosingTicket', () => {
  it('maps closing-ticket fields onto their new-owner-ticket counterparts', () => {
    const payload = buildNewOwnerPayloadFromClosingTicket({
      cr7de_ticketid: 'CT-1001',
      cr7de_unitnumber: '1A',
      cr7de_buyername: 'Alex Buyer',
      cr109_buyer2name: 'Jamie Buyer',
      cr7de_sellername: 'Sam Seller',
    })

    expect(payload).toEqual({
      cr7de_ticketid: 'CT-1001',
      cr7de_unit: '1A',
      cr7de_newprimaryownername: 'Alex Buyer',
      cr7de_newsecondaryownername: 'Jamie Buyer',
      cr7de_sellername: 'Sam Seller',
    })
  })

  it('only includes fields that are actually present on the source (no accidental undefined overwrites)', () => {
    const payload = buildNewOwnerPayloadFromClosingTicket({
      cr7de_ticketid: 'CT-1001',
    })
    expect(Object.keys(payload)).toEqual(['cr7de_ticketid'])
  })

  it('copies over an explicit empty string (still "present")', () => {
    const payload = buildNewOwnerPayloadFromClosingTicket({
      cr7de_buyername: '',
    })
    expect(payload.cr7de_newprimaryownername).toBe('')
  })
})

describe('buildClosingPayloadFromNewOwnerTicket', () => {
  it('maps new-owner-ticket fields back onto their closing-ticket counterparts', () => {
    const payload = buildClosingPayloadFromNewOwnerTicket({
      cr7de_ticketid: 'CT-1001',
      cr7de_unit: '1A',
      cr7de_newprimaryownername: 'Alex Buyer',
      cr7de_newsecondaryownername: 'N/A',
      cr7de_sellername: 'Sam Seller',
    })

    expect(payload).toEqual({
      cr7de_ticketid: 'CT-1001',
      cr7de_unitnumber: '1A',
      cr7de_buyername: 'Alex Buyer',
      cr109_buyer2name: 'N/A',
      cr7de_sellername: 'Sam Seller',
    })
  })

  it('only includes fields that are actually present on the source', () => {
    const payload = buildClosingPayloadFromNewOwnerTicket({
      cr7de_unit: '1A',
    })
    expect(Object.keys(payload)).toEqual(['cr7de_unitnumber'])
  })

  it('round-trips through both directions without losing the mapped fields', () => {
    const closingPayload = buildNewOwnerPayloadFromClosingTicket({
      cr7de_ticketid: 'CT-2002',
      cr7de_buyername: 'Alex Buyer',
    })
    const backToClosing =
      buildClosingPayloadFromNewOwnerTicket(closingPayload)

    expect(backToClosing).toEqual({
      cr7de_ticketid: 'CT-2002',
      cr7de_buyername: 'Alex Buyer',
    })
  })
})
