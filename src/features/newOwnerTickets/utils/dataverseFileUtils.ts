import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../../../.power/schemas/appschemas/dataSourcesInfo'
import type { Cr7de_closingticketdetailsesUploadColumnName } from '../../../generated/models/Cr7de_closingticketdetailsesModel'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'

export type NewOwnerDocumentKey =
  | 'purchaseApplicationForm'
  | 'rptt'

export interface NewOwnerDocumentDefinition {
  key: NewOwnerDocumentKey
  label: string
  columnName: Cr7de_closingticketdetailsesUploadColumnName
  fileNameColumn:
    | 'cr109_purchaseapplicationform_name'
    | 'cr109_rpttdocument_name'
}

export interface DataverseFilePreview {
  url: string
  contentType: string
  previewType: 'pdf' | 'image' | 'unsupported'
}

const CLOSING_TICKET_TABLE_NAME =
  'cr7de_closingticketdetailses'
const dataverseClient = getClient(dataSourcesInfo)

export const NEW_OWNER_DOCUMENTS: readonly NewOwnerDocumentDefinition[] =
  [
    {
      key: 'purchaseApplicationForm',
      label: 'Purchase Application Form',
      columnName: 'cr109_purchaseapplicationform',
      fileNameColumn: 'cr109_purchaseapplicationform_name',
    },
    {
      key: 'rptt',
      label: 'RPTT',
      columnName: 'cr109_rpttdocument',
      fileNameColumn: 'cr109_rpttdocument_name',
    },
  ]

export function getDocumentDefinition(
  key: NewOwnerDocumentKey
) {
  return (
    NEW_OWNER_DOCUMENTS.find(
      (document) => document.key === key
    ) ?? null
  )
}

export function hasDocument(
  closingTicket: ClosingTicketRecord,
  document: NewOwnerDocumentDefinition
) {
  return Boolean(
    closingTicket[document.columnName] ||
      closingTicket[document.fileNameColumn]
  )
}

export function getDefaultDocument(
  closingTicket: ClosingTicketRecord
): NewOwnerDocumentKey | null {
  return (
    NEW_OWNER_DOCUMENTS.find((document) =>
      hasDocument(closingTicket, document)
    )?.key ?? null
  )
}

export function getDocumentFileName(
  closingTicket: ClosingTicketRecord,
  document: NewOwnerDocumentDefinition
) {
  return (
    closingTicket[document.fileNameColumn] ??
    document.label
  )
}

export function getDocumentUrl(
  closingTicket: ClosingTicketRecord,
  document: NewOwnerDocumentDefinition
) {
  const fileValue = closingTicket[document.columnName]

  if (
    fileValue?.startsWith('http') ||
    fileValue?.startsWith('blob:') ||
    fileValue?.startsWith('data:')
  ) {
    return fileValue
  }

  if (!hasDocument(closingTicket, document)) {
    return null
  }

  return `cr7de_closingticketdetailses(${closingTicket.cr7de_closingticketdetailsid})/${document.columnName}/$value`
}

function getPreviewType(
  contentType: string,
  fileName: string
): DataverseFilePreview['previewType'] {
  const normalizedContentType = contentType.toLowerCase()
  const normalizedFileName = fileName.toLowerCase()

  if (
    normalizedContentType.includes('pdf') ||
    normalizedFileName.endsWith('.pdf')
  ) {
    return 'pdf'
  }

  if (
    normalizedContentType.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|bmp)$/i.test(normalizedFileName)
  ) {
    return 'image'
  }

  return 'unsupported'
}

function getContentType(fileName: string) {
  const normalizedFileName = fileName.toLowerCase()

  if (normalizedFileName.endsWith('.pdf')) {
    return 'application/pdf'
  }

  if (
    normalizedFileName.endsWith('.jpg') ||
    normalizedFileName.endsWith('.jpeg')
  ) {
    return 'image/jpeg'
  }

  if (normalizedFileName.endsWith('.png')) {
    return 'image/png'
  }

  if (normalizedFileName.endsWith('.gif')) {
    return 'image/gif'
  }

  if (normalizedFileName.endsWith('.webp')) {
    return 'image/webp'
  }

  if (normalizedFileName.endsWith('.bmp')) {
    return 'image/bmp'
  }

  return 'application/octet-stream'
}

function withAbortTimeout<T>(
  promise: Promise<T>,
  signal?: AbortSignal
) {
  if (!signal) {
    return promise
  }

  return new Promise<T>((resolve, reject) => {
    const abortHandler = () => {
      reject(new DOMException('Aborted', 'AbortError'))
    }

    if (signal.aborted) {
      abortHandler()
      return
    }

    signal.addEventListener('abort', abortHandler, {
      once: true,
    })

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal.removeEventListener('abort', abortHandler)
      })
  })
}

export async function getDataverseFileUrl(
  closingTicket: ClosingTicketRecord,
  document: NewOwnerDocumentDefinition,
  signal?: AbortSignal
): Promise<DataverseFilePreview> {
  if (!hasDocument(closingTicket, document)) {
    throw new Error('No file present')
  }

  const response = await withAbortTimeout(
    dataverseClient.downloadFileFromRecord(
      CLOSING_TICKET_TABLE_NAME,
      closingTicket.cr7de_closingticketdetailsid,
      document.columnName
    ),
    signal
  )

  if (!response.success || !response.data) {
    throw new Error('Unable to preview file.')
  }

  const fileName = getDocumentFileName(closingTicket, document)
  const contentType = getContentType(fileName)
  const fileBytes = new Uint8Array(response.data)
  const blob = new Blob([fileBytes.buffer], {
    type: contentType,
  })

  return {
    url: URL.createObjectURL(blob),
    contentType,
    previewType: getPreviewType(contentType, fileName),
  }
}
