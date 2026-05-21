import type { Cr7de_invoicedetailses } from '../../../generated/models/Cr7de_invoicedetailsesModel'
import type {
  Cr7de_invoicedetailsescr109_dueatclosing,
  Cr7de_invoicedetailsescr7de_paidby,
  Cr7de_invoicedetailsescr7de_payableto,
} from '../../../generated/models/Cr7de_invoicedetailsesModel'

export type InvoiceRecord = Cr7de_invoicedetailses

export type InvoiceColumnKey =
  | 'cr109_dueatclosing'
  | 'cr7de_paidby'
  | 'cr7de_amount'
  | 'cr7de_payableto'
  | 'cr7de_chequenumber'
  | 'cr7de_remarks'
  | 'cr7de_notapplicabletoledger'
  | 'createdon'

export type InvoiceColumn = {
  key: InvoiceColumnKey
  label: string
}

export type InvoiceGroupKey =
  | 'Seller'
  | 'Buyer'
  | 'Other'

export type InvoiceCreateInput = Partial<
  Pick<
    Cr7de_invoicedetailses,
    | 'cr109_dueatclosing'
    | 'cr7de_amount'
    | 'cr7de_chequenumber'
    | 'cr7de_index'
    | 'cr7de_notapplicabletoledger'
    | 'cr7de_paidby'
    | 'cr7de_payableto'
    | 'cr7de_remarks'
    | 'cr7de_ticketid'
  >
>

export type InvoiceUpdateInput = Partial<
  Omit<InvoiceCreateInput, 'cr7de_ticketid'>
>

export type InvoiceChargeFormRow = {
  id: string
  cr109_dueatclosing:
    | ''
    | Cr7de_invoicedetailsescr109_dueatclosing
  cr7de_amount: string
  cr7de_chequenumber: string
  cr7de_index: string
  cr7de_notapplicabletoledger: boolean
  cr7de_paidby: '' | Cr7de_invoicedetailsescr7de_paidby
  cr7de_payableto:
    | ''
    | Cr7de_invoicedetailsescr7de_payableto
  cr7de_remarks: string
}
