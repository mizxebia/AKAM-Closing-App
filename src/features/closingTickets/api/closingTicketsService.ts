import { Cr7de_closingticketdetailsesService } from '../../../generated'
import type { Cr7de_closingticketdetailses } from '../../../generated/models/Cr7de_closingticketdetailsesModel'
import type {
  ClosingTicketCreateInput,
  ClosingTicketRecord,
  ClosingTicketUpdateInput,
} from '../types/closingTicket'

type ClosingTicketUploadColumnName =
  | 'cr109_purchaseapplicationform'
  | 'cr109_rpttdocument'

const fileNameColumnByUploadColumn: Record<
  ClosingTicketUploadColumnName,
  'cr109_purchaseapplicationform_name' | 'cr109_rpttdocument_name'
> = {
  cr109_purchaseapplicationform:
    'cr109_purchaseapplicationform_name',
  cr109_rpttdocument: 'cr109_rpttdocument_name',
}

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

  return result.data as ClosingTicketRecord
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

export async function updateClosingTicket(
  id: string,
  changedFields: ClosingTicketUpdateInput
): Promise<ClosingTicketRecord> {
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
  const fileNameColumn =
    fileNameColumnByUploadColumn[columnName]
  const result =
    await Cr7de_closingticketdetailsesService.update(
      id,
      {
        [columnName]: null,
        [fileNameColumn]: null,
      } as unknown as ClosingTicketUpdateInput
    )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to delete uploaded document'
    )
  }

  return result.data as ClosingTicketRecord
}
