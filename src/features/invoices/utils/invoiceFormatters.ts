import {
  Cr7de_invoicedetailsescr109_dueatclosing,
  Cr7de_invoicedetailsescr7de_paidby,
  Cr7de_invoicedetailsescr7de_payableto,
} from '../../../generated/models/Cr7de_invoicedetailsesModel'
import type {
  InvoiceColumnKey,
  InvoiceGroupKey,
  InvoiceRecord,
} from '../types/invoice'

const currencyFormatter = new Intl.NumberFormat(
  undefined,
  {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }
)

export function formatGeneratedLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Explicit display labels for Payable To enum values. */
const PAYABLE_TO_LABELS: Record<string, string> = {
  Building: 'Building',
  AKAMAssociates_Inc: 'AKAM Associates, Inc',
  Other: 'Other',
}

/** Formats a raw Payable To enum key into a human-readable label. */
export function formatPayableToLabel(raw: string): string {
  return PAYABLE_TO_LABELS[raw] ?? formatGeneratedLabel(raw)
}
export function formatInvoiceDate(value?: string) {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)

  return Number.isNaN(parsedDate.getTime())
    ? value
    : parsedDate.toLocaleDateString()
}

export function formatInvoiceCurrency(value?: string) {
  if (!value) {
    return '-'
  }

  const numericValue = Number(
    value.replace(/[$,]/g, '')
  )

  return Number.isNaN(numericValue)
    ? value
    : currencyFormatter.format(numericValue)
}

export function formatInvoiceBoolean(value?: boolean) {
  if (value === undefined || value === null) {
    return '-'
  }

  return value ? 'Not applicable' : 'Applicable'
}

export function formatDueAtClosing(
  value: InvoiceRecord['cr109_dueatclosing']
) {
  if (value === undefined || value === null) {
    return '-'
  }

  // Dataverse option sets are numeric values in records; generated constants
  // map those values to readable labels so users never see raw option numbers.
  const label =
    Cr7de_invoicedetailsescr109_dueatclosing[value]

  return label ? formatGeneratedLabel(label) : String(value)
}

export function formatPaidBy(
  value: InvoiceRecord['cr7de_paidby']
) {
  if (value === undefined || value === null) {
    return '-'
  }

  // Choice display follows the generated enum object pattern:
  // Cr7de_invoicedetailsescr7de_paidby[value].
  return (
    Cr7de_invoicedetailsescr7de_paidby[value] ??
    String(value)
  )
}

export function formatPayableTo(
  value: InvoiceRecord['cr7de_payableto']
) {
  if (value === undefined || value === null) {
    return '-'
  }

  const raw =
    Cr7de_invoicedetailsescr7de_payableto[value] ??
    String(value)

  return formatPayableToLabel(raw)
}

export function formatInvoiceValue(
  record: InvoiceRecord,
  key: InvoiceColumnKey
) {
  const rawValue = record[key]

  if (
    rawValue === undefined ||
    rawValue === null ||
    rawValue === ''
  ) {
    return '-'
  }

  if (key === 'cr109_dueatclosing') {
    return formatDueAtClosing(record.cr109_dueatclosing)
  }

  if (key === 'cr7de_paidby') {
    return formatPaidBy(record.cr7de_paidby)
  }

  if (key === 'cr7de_payableto') {
    return formatPayableTo(record.cr7de_payableto)
  }

  if (key === 'cr7de_amount') {
    return formatInvoiceCurrency(record.cr7de_amount)
  }

  if (key === 'cr7de_notapplicabletoledger') {
    return formatInvoiceBoolean(
      record.cr7de_notapplicabletoledger
    )
  }

  if (key === 'createdon') {
    return formatInvoiceDate(record.createdon)
  }

  return String(rawValue)
}

export function getInvoiceGroupKey(
  record: InvoiceRecord
): InvoiceGroupKey {
  const paidBy = formatPaidBy(record.cr7de_paidby)

  if (paidBy === 'Seller') {
    return 'Seller'
  }

  if (paidBy === 'Buyer') {
    return 'Buyer'
  }

  return 'Other'
}

