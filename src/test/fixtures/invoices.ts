import type { InvoiceRecord } from '../../features/invoices/types/invoice'

function baseInvoice(overrides: Partial<InvoiceRecord>): InvoiceRecord {
  return {
    cr7de_invoicedetailsid: 'invoice-0000',
    cr7de_ticketid: 'CT-1001',
    cr7de_index: '1',
    cr7de_amount: '100.00',
    cr7de_paidby: 716070000, // Seller
    cr7de_payableto: 716070000, // Building
    cr109_dueatclosing: 396620001, // AdminFee
    cr7de_notapplicabletoledger: false,
    createdon: '2026-01-05T10:00:00Z',
    ...overrides,
  } as unknown as InvoiceRecord
}

export const invoiceFixtures: InvoiceRecord[] = [
  baseInvoice({
    cr7de_invoicedetailsid: 'invoice-seller-1',
    cr7de_amount: '150.00',
    cr7de_paidby: 716070000, // Seller
    cr7de_payableto: 716070000, // Building
  }),
  baseInvoice({
    cr7de_invoicedetailsid: 'invoice-buyer-1',
    cr7de_amount: '75.50',
    cr7de_paidby: 716070001, // Buyer
    cr7de_payableto: 716070001, // AKAMAssociates_Inc
  }),
  baseInvoice({
    cr7de_invoicedetailsid: 'invoice-other-1',
    cr7de_amount: '0',
    cr7de_paidby: undefined,
    cr7de_payableto: 716070002, // Other
    cr7de_notapplicabletoledger: true,
  }),
  baseInvoice({
    cr7de_invoicedetailsid: 'invoice-malformed-amount',
    cr7de_amount: 'TBD',
  }),
]
