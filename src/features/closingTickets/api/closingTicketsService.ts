import { Cr7de_closingticketdetailsesService } from '../../../generated'
import type { Cr7de_closingticketdetailses } from '../../../generated/models/Cr7de_closingticketdetailsesModel'
import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../../../.power/schemas/appschemas/dataSourcesInfo'
import type {
  ClosingTicketCreateInput,
  ClosingTicketRecord,
  ClosingTicketUpdateInput,
} from '../types/closingTicket'
import {
  writeChangeLog,
  extractOldValues,
} from '../../auditLog/api/auditLogService'
import { trimStringFields } from '../../../lib/textNormalization'

export type ClosingTicketUploadColumnName =
  | 'cr109_purchaseapplicationform'
  | 'cr109_rpttdocument'
  | 'cr109_closingticketdetailspdf'
  | 'cr109_newownerticketpdf'
  | 'cr109_chequesdocument'
  | 'cr109_batchdocument'

const TABLE_NAME = 'cr7de_closingticketdetailses'
const closingTicketTableName = TABLE_NAME
const dataverseClient = getClient(dataSourcesInfo)

export async function getClosingTickets(): Promise<
  ClosingTicketRecord[]
> {
  const response =
    await Cr7de_closingticketdetailsesService.getAll()

  if (!response.success) {
    throw new Error(
      response.error?.message ||
        'Failed to fetch closing ticket records'
    )
  }

  return (response.data ?? []) as ClosingTicketRecord[]
}

export async function createClosingTicket(
  newRecord: ClosingTicketCreateInput
): Promise<ClosingTicketRecord> {
  newRecord = trimStringFields(newRecord)

  const result =
    await Cr7de_closingticketdetailsesService.create(
      newRecord as Omit<
        Cr7de_closingticketdetailses,
        'cr7de_closingticketdetailsid'
      >
    )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to create closing ticket record'
    )
  }

  const created = result.data as ClosingTicketRecord

  writeChangeLog({
    // Use the human-readable CL- ticket reference, consistent with all
    // other writeChangeLog callers across the codebase.
    ticketId: created.cr7de_ticketid ?? created.cr7de_closingticketdetailsid,
    tableName: TABLE_NAME,
    operation: 'create',
    oldData: null,
    newData: newRecord as Record<string, unknown>,
  })

  return created
}

export async function getClosingTicketById(
  id: string
): Promise<ClosingTicketRecord> {
  const response =
    await Cr7de_closingticketdetailsesService.get(id)

  if (!response.success || !response.data) {
    throw new Error(
      response.error?.message ||
        'Failed to load closing ticket record'
    )
  }

  return response.data as ClosingTicketRecord
}

/**
 * @param oldRecord - Pass the record as it was before the update when
 *   available in the caller's scope. This enables a clean field-level diff
 *   in the audit log without an extra round-trip. When omitted, the service
 *   fetches the current record before updating so old values are always captured.
 */
export async function updateClosingTicket(
  id: string,
  changedFields: ClosingTicketUpdateInput,
  oldRecord?: ClosingTicketRecord
): Promise<ClosingTicketRecord> {
  // Fetch the current record before mutating so we always have old values
  // for the audit diff, even when callers don't provide it.
  const recordBefore = oldRecord ?? await getClosingTicketById(id)

  changedFields = trimStringFields(changedFields)

  const result =
    await Cr7de_closingticketdetailsesService.update(
      id,
      changedFields
    )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to update closing ticket record'
    )
  }

  // Use the human-readable CL- ticket reference from the record itself,
  // not the GUID (id) which is the Dataverse primary key.
  const ticketRef =
    recordBefore.cr7de_ticketid ??
    (result.data as ClosingTicketRecord)?.cr7de_ticketid ??
    id

  writeChangeLog({
    ticketId: ticketRef,
    tableName: TABLE_NAME,
    operation: 'update',
    oldData: extractOldValues(
      recordBefore,
      changedFields
    ),
    newData: changedFields as Record<string, unknown>,
  })

  return result.data as ClosingTicketRecord
}

export async function uploadClosingTicketFile(
  id: string,
  columnName: ClosingTicketUploadColumnName,
  file: File
) {
  const result =
    await Cr7de_closingticketdetailsesService.upload(
      id,
      columnName,
      file,
      file.name
    )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        `Failed to upload ${file.name}`
    )
  }
}

export async function deleteClosingTicketFile(
  id: string,
  columnName: ClosingTicketUploadColumnName
) {
  const result =
    await dataverseClient.deleteFileOrImageFromRecord(
      closingTicketTableName,
      id,
      columnName
    )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to delete uploaded document'
    )
  }

  return getClosingTicketById(id)
}
