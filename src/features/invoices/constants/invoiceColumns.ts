import type { InvoiceColumn } from '../types/invoice'

export const invoiceColumns: InvoiceColumn[] = [
  {
    key: 'cr109_dueatclosing',
    label: 'Charge Title',
  },
  {
    key: 'cr7de_paidby',
    label: 'Party Type',
  },
  {
    key: 'cr7de_amount',
    label: 'Amount',
  },
  {
    key: 'cr7de_payableto',
    label: 'Payable To',
  },
  {
    key: 'cr7de_chequenumber',
    label: 'Cheque #',
  },
  {
    key: 'cr7de_notapplicabletoledger',
    label: 'Ledger',
  },
  {
    key: 'createdon',
    label: 'Created On',
  },
]

