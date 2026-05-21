import { Cr7de_invoicedetailsesService } from '../../../generated'
import type { Cr7de_invoicedetailses } from '../../../generated/models/Cr7de_invoicedetailsesModel'
import type {
  InvoiceCreateInput,
  InvoiceRecord,
  InvoiceUpdateInput,
} from '../types/invoice'

function escapeODataString(value: string) {
  return value.replace(/'/g, "''")
}

export async function getInvoicesByClosingTicketId(
  ticketId: string
): Promise<InvoiceRecord[]> {
  if (!ticketId.trim()) {
    return []
  }

  // Parent-child relationship handling:
  // this generated invoice model exposes cr7de_ticketid as the linking field,
  // so child records are loaded by matching it to the parent closing Ticket ID.
  const response =
    await Cr7de_invoicedetailsesService.getAll({
      filter: `cr7de_ticketid eq '${escapeODataString(
        ticketId
      )}'`,
      orderBy: ['createdon desc'],
    })

  if (!response.success) {
    throw new Error(
      response.error?.message ||
        'Failed to load invoice details'
    )
  }

  return (response.data ?? []) as InvoiceRecord[]
}

export async function createInvoiceDetail(
  newRecord: InvoiceCreateInput
): Promise<InvoiceRecord> {
  const result =
    await Cr7de_invoicedetailsesService.create(
      newRecord as Omit<
        Cr7de_invoicedetailses,
        'cr7de_invoicedetailsid'
      >
    )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to create invoice detail record'
    )
  }

  return result.data as InvoiceRecord
}

export async function updateInvoiceDetail(
  invoiceId: string,
  changedFields: InvoiceUpdateInput
): Promise<InvoiceRecord> {
  const result =
    await Cr7de_invoicedetailsesService.update(
      invoiceId,
      changedFields as Partial<
        Omit<
          Cr7de_invoicedetailses,
          'cr7de_invoicedetailsid'
        >
      >
    )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to update invoice detail record'
    )
  }

  return result.data as InvoiceRecord
}

export async function deleteInvoiceDetail(
  invoiceId: string
): Promise<void> {
  await Cr7de_invoicedetailsesService.delete(invoiceId)
}
