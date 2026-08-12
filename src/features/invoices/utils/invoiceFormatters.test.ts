import { describe, expect, it } from 'vitest'
import {
  formatDueAtClosing,
  formatInvoiceBoolean,
  formatInvoiceCurrency,
  formatInvoiceDate,
  formatInvoiceValue,
  formatPaidBy,
  formatPayableTo,
  formatPayableToLabel,
  getInvoiceGroupKey,
} from './invoiceFormatters'
import { invoiceFixtures } from '../../../test/fixtures/invoices'

describe('formatInvoiceCurrency', () => {
  it('formats a numeric string as USD currency', () => {
    expect(formatInvoiceCurrency('150.00')).toContain('150')
  })

  it('strips $ and , before parsing', () => {
    expect(formatInvoiceCurrency('$1,234.50')).toContain('1,234.50')
  })

  it('returns "-" for a missing value', () => {
    expect(formatInvoiceCurrency(undefined)).toBe('-')
  })

  it('returns the raw value when it cannot be parsed as a number', () => {
    expect(formatInvoiceCurrency('TBD')).toBe('TBD')
  })
})

describe('formatInvoiceBoolean', () => {
  it('inverts the "not applicable to ledger" flag into a display label', () => {
    expect(formatInvoiceBoolean(true)).toBe('Not applicable')
    expect(formatInvoiceBoolean(false)).toBe('Applicable')
  })

  it('returns "-" when undefined/null', () => {
    expect(formatInvoiceBoolean(undefined)).toBe('-')
  })
})

describe('formatDueAtClosing / formatPaidBy / formatPayableTo', () => {
  it('maps known option-set values to labels', () => {
    expect(formatDueAtClosing(396620001)).toBe('Admin Fee')
    expect(formatPaidBy(716070000)).toBe('Seller')
    expect(formatPaidBy(716070001)).toBe('Buyer')
    expect(formatPayableTo(716070000)).toBe('Building')
    expect(formatPayableTo(716070001)).toBe('AKAM Associates, Inc')
  })

  it('returns "-" for undefined/null', () => {
    expect(formatDueAtClosing(undefined)).toBe('-')
    expect(formatPaidBy(undefined)).toBe('-')
    expect(formatPayableTo(undefined)).toBe('-')
  })
})

describe('formatPayableToLabel', () => {
  it('uses the explicit label map when available', () => {
    expect(formatPayableToLabel('AKAMAssociates_Inc')).toBe(
      'AKAM Associates, Inc'
    )
  })

  it('falls back to humanizing unknown raw values', () => {
    expect(formatPayableToLabel('SomeOther_Value')).toBe(
      'Some Other Value'
    )
  })
})

describe('formatInvoiceDate', () => {
  it('returns "-" for a missing value', () => {
    expect(formatInvoiceDate(undefined)).toBe('-')
  })

  it('formats a valid date string', () => {
    expect(formatInvoiceDate('2026-01-05T10:00:00Z')).not.toBe('-')
  })
})

describe('formatInvoiceValue', () => {
  const invoice = invoiceFixtures[0]

  it('routes each column through its dedicated formatter', () => {
    expect(formatInvoiceValue(invoice, 'cr7de_paidby')).toBe('Seller')
    expect(formatInvoiceValue(invoice, 'cr7de_payableto')).toBe(
      'Building'
    )
    expect(formatInvoiceValue(invoice, 'cr109_dueatclosing')).toBe(
      'Admin Fee'
    )
    expect(formatInvoiceValue(invoice, 'cr7de_amount')).toContain('150')
  })

  it('returns "-" for empty/undefined fields regardless of column', () => {
    expect(
      formatInvoiceValue(
        { ...invoice, cr7de_chequenumber: undefined },
        'cr7de_chequenumber'
      )
    ).toBe('-')
  })
})

describe('getInvoiceGroupKey', () => {
  it('groups fixtures into Seller/Buyer/Other exactly as expected', () => {
    const groups = invoiceFixtures.map((invoice) => ({
      id: invoice.cr7de_invoicedetailsid,
      group: getInvoiceGroupKey(invoice),
    }))

    expect(groups).toEqual([
      { id: 'invoice-seller-1', group: 'Seller' },
      { id: 'invoice-buyer-1', group: 'Buyer' },
      { id: 'invoice-other-1', group: 'Other' },
      { id: 'invoice-malformed-amount', group: 'Seller' },
    ])
  })
})
