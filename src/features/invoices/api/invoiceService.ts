import { Cr7de_invoicedetailsesService } from '../../../generated'
import type { Cr7de_invoicedetailses } from '../../../generated/models/Cr7de_invoicedetailsesModel'
import type {
  InvoiceCreateInput,
  InvoiceRecord,
  InvoiceUpdateInput,
} from '../types/invoice'
import {
  writeChangeLog,
  extractOldValues,
} from '../../auditLog/api/auditLogService'

const TABLE_NAME = 'cr7de_invoicedetailses'

function escapeODataString(value: string) {
  return value.replace(/'/g, "''")
}

export async function getInvoicesByClosingTicketId(
  ticketId: string
): Promise<InvoiceRecord[]> {
  if (!ticketId.trim()) {
    return []
  }

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

  const created = result.data as InvoiceRecord

  writeChangeLog({
    ticketId: newRecord.cr7de_ticketid ?? '',
    tableName: TABLE_NAME,
    operation: 'create',
    oldData: null,
    newData: newRecord as Record<string, unknown>,
  })

  return created
}

/**
 * @param oldRecord - The record as it existed before the update.
 *   Pass this when the caller already has it in memory (e.g. from the
 *   InvoiceTable edit flow) to avoid an extra Dataverse round-trip.
 *   When omitted, only `changedFields` are recorded as newData with no oldData diff.
 */
export async function updateInvoiceDetail(
  invoiceId: string,
  changedFields: InvoiceUpdateInput,
  context: { ticketId: string; oldRecord?: InvoiceRecord }
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

  writeChangeLog({
    ticketId: context.ticketId,
    tableName: TABLE_NAME,
    operation: 'update',
    oldData: context.oldRecord
      ? extractOldValues(
          context.oldRecord,
          changedFields as Partial<InvoiceRecord>
        )
      : null,
    newData: changedFields as Record<string, unknown>,
  })

  return result.data as InvoiceRecord
}

export async function deleteInvoiceDetail(
  invoiceId: string,
  context: { ticketId: string; oldRecord: InvoiceRecord }
): Promise<void> {
  await Cr7de_invoicedetailsesService.delete(invoiceId)

  writeChangeLog({
    ticketId: context.ticketId,
    tableName: TABLE_NAME,
    operation: 'delete',
    oldData: context.oldRecord as unknown as Record<string, unknown>,
    newData: null,
  })
}
