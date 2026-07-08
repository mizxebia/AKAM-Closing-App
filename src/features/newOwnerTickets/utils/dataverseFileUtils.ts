import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../../../.power/schemas/appschemas/dataSourcesInfo'
import type { Cr7de_closingticketdetailsesUploadColumnName } from '../../../generated/models/Cr7de_closingticketdetailsesModel'

import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'

export type NewOwnerDocumentKey =
  | 'purchaseApplicationForm'
  | 'rptt'
  | 'newOwnerTicketPdf'

export type GeneratedClosingDocumentKey =
  | 'newOwnerTicketPdf'
  | 'closingTicketDetailsPdf'

export type ClosingTicketDocumentKey =
  | NewOwnerDocumentKey
  | GeneratedClosingDocumentKey

export interface NewOwnerDocumentDefinition {
  key: ClosingTicketDocumentKey
  label: string
  columnName: Cr7de_closingticketdetailsesUploadColumnName
  fileNameColumn:
    | 'cr109_closingticketdetailspdf_name'
    | 'cr109_newownerticketpdf_name'
    | 'cr109_purchaseapplicationform_name'
    | 'cr109_rpttdocument_name'
}

export interface DataverseFilePreview {
  /** Blob URL (for PDFs) or data: URL (for images). Use this in src/href. */
  url: string
  /**
   * The raw data: URL. Only present as a fallback; prefer `url` for rendering.
   * For PDFs, using `url` (blob URL) avoids the browser showing the embedded
   * PDF /Title metadata instead of the Dataverse filename.
   */
  dataUrl: string
  contentType: string
  base64Content: string
  previewType:
    | 'pdf'
    | 'image'
    | 'unsupported'
}

const CLOSING_TICKET_TABLE_NAME =
  'cr7de_closingticketdetailses'
const dataverseClient = getClient(dataSourcesInfo)

export const NEW_OWNER_DOCUMENTS:
  readonly NewOwnerDocumentDefinition[] =
  [
    {
      key:
        'purchaseApplicationForm',
      label:
        'Purchase Application Form',
      columnName:
        'cr109_purchaseapplicationform',
      fileNameColumn:
        'cr109_purchaseapplicationform_name',
    },

    {
      key: 'rptt',
      label: 'RPTT',
      columnName:
        'cr109_rpttdocument',
      fileNameColumn:
        'cr109_rpttdocument_name',
    },

    {
      key: 'newOwnerTicketPdf',
      label: 'New Owner Ticket',
      columnName:
        'cr109_newownerticketpdf',
      fileNameColumn:
        'cr109_newownerticketpdf_name',
    },
  ]

export const GENERATED_CLOSING_DOCUMENTS:
  readonly NewOwnerDocumentDefinition[] =
  [
    {
      key: 'newOwnerTicketPdf',
      label: 'New Owner Ticket PDF',
      columnName: 'cr109_newownerticketpdf',
      fileNameColumn: 'cr109_newownerticketpdf_name',
    },
    {
      key: 'closingTicketDetailsPdf',
      label: 'Invoice',
      columnName: 'cr109_closingticketdetailspdf',
      fileNameColumn: 'cr109_closingticketdetailspdf_name',
    },
  ]

export function getDocumentDefinition(
  key: ClosingTicketDocumentKey,
  documents: readonly NewOwnerDocumentDefinition[] =
    NEW_OWNER_DOCUMENTS
) {

  return (
    documents.find(
      (document) =>
        document.key === key
    ) ?? null
  )
}

export function hasDocument(
  closingTicket: ClosingTicketRecord,
  document: NewOwnerDocumentDefinition
) {

  return Boolean(
    closingTicket[
      document.columnName
    ] ||
      closingTicket[
        document.fileNameColumn
      ]
  )
}

export function getDefaultDocument(
  closingTicket: ClosingTicketRecord,
  documents: readonly NewOwnerDocumentDefinition[] =
    NEW_OWNER_DOCUMENTS
): ClosingTicketDocumentKey | null {

  return (
    documents.find(
      (document) =>
        hasDocument(
          closingTicket,
          document
        )
    )?.key ?? null
  )
}

export function getDocumentFileName(
  closingTicket: ClosingTicketRecord,
  document: NewOwnerDocumentDefinition
) {

  return (
    closingTicket[
      document.fileNameColumn
    ] ?? document.label
  )
}

function getPreviewType(
  contentType: string,
  fileName: string
): DataverseFilePreview['previewType'] {

  const normalizedContentType =
    contentType.toLowerCase()

  const normalizedFileName =
    fileName.toLowerCase()

  if (
    normalizedContentType.includes(
      'pdf'
    ) ||
    normalizedFileName.endsWith(
      '.pdf'
    )
  ) {
    return 'pdf'
  }

  if (
    normalizedContentType.startsWith(
      'image/'
    ) ||
    /\.(png|jpe?g|gif|webp|bmp)$/i.test(
      normalizedFileName
    )
  ) {
    return 'image'
  }

  return 'unsupported'
}

function getContentType(
  fileName: string
) {

  const normalizedFileName =
    fileName.toLowerCase()

  if (
    normalizedFileName.endsWith(
      '.pdf'
    )
  ) {
    return 'application/pdf'
  }

  if (
    normalizedFileName.endsWith(
      '.jpg'
    ) ||
    normalizedFileName.endsWith(
      '.jpeg'
    )
  ) {
    return 'image/jpeg'
  }

  if (
    normalizedFileName.endsWith(
      '.png'
    )
  ) {
    return 'image/png'
  }

  if (
    normalizedFileName.endsWith(
      '.gif'
    )
  ) {
    return 'image/gif'
  }

  if (
    normalizedFileName.endsWith(
      '.webp'
    )
  ) {
    return 'image/webp'
  }

  if (
    normalizedFileName.endsWith(
      '.bmp'
    )
  ) {
    return 'image/bmp'
  }

  return 'application/octet-stream'
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return window.btoa(binary)
}

function normalizeFileContentToBase64(
  data: unknown
) {

  if (data instanceof Uint8Array) {
    return bytesToBase64(data)
  }

  if (data instanceof ArrayBuffer) {
    return bytesToBase64(
      new Uint8Array(data)
    )
  }

  if (ArrayBuffer.isView(data)) {
    return bytesToBase64(
      new Uint8Array(
        data.buffer,
        data.byteOffset,
        data.byteLength
      )
    )
  }

  if (typeof data === 'string') {
    const trimmedData = data.trim()
    const dataUrlMatch =
      /^data:[^;]+;base64,(.*)$/i.exec(
        trimmedData
      )

    return dataUrlMatch
      ? dataUrlMatch[1]
      : trimmedData
  }

  return null
}

/**
 * Converts a base64 string to a Blob object URL.
 * Using a blob: URL instead of a data: URL prevents the browser's built-in
 * PDF viewer from showing the embedded PDF /Title metadata (e.g. the original
 * scanner filename) in its toolbar. The app's own DocumentViewerPanel header
 * already displays the correct Dataverse filename, so the viewer toolbar title
 * is unnecessary and confusing when it differs from the stored filename.
 *
 * Appending #toolbar=0 further suppresses the browser PDF toolbar so the
 * filename is never shown at all inside the iframe.
 */
export function base64ToBlobUrl(
  base64Content: string,
  contentType: string
): string {
  const binaryString = window.atob(base64Content)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const blob = new Blob([bytes], { type: contentType })
  return URL.createObjectURL(blob)
}

function isPdfBase64(base64Content: string) {
  return base64Content.startsWith('JVBER')
}

function getResolvedContentType(
  contentType: string,
  base64Content: string
) {
  if (isPdfBase64(base64Content)) {
    return 'application/pdf'
  }

  return contentType
}

function isValidPdfBase64(
  base64Content: string,
  previewType: DataverseFilePreview['previewType']
) {
  return (
    previewType !== 'pdf' ||
    isPdfBase64(base64Content)
  )
}

export async function getDataverseFileUrl(
  closingTicket: ClosingTicketRecord,
  document: NewOwnerDocumentDefinition
): Promise<DataverseFilePreview> {

  if (
    !hasDocument(
      closingTicket,
      document
    )
  ) {
    throw new Error(
      'No file present'
    )
  }

  const fileName =
    getDocumentFileName(
      closingTicket,
      document
    )

  const contentType =
    getContentType(fileName)

  const recordId =
    closingTicket.cr7de_closingticketdetailsid

  const response =
    await dataverseClient.downloadFileFromRecord(
      CLOSING_TICKET_TABLE_NAME,
      recordId,
      document.columnName
    )

  console.log(
    'Document API response:',
    response
  )

  if (!response.success || !response.data) {
    throw new Error(
      'Unable to preview file.'
    )
  }

  const base64Content =
    normalizeFileContentToBase64(
      response.data
    )

  console.log(
    'Base64 sample:',
    typeof base64Content === 'string'
      ? base64Content.substring(0, 50)
      : 'invalid'
  )

  if (!base64Content) {
    throw new Error(
      'Unable to preview file.'
    )
  }

  const resolvedContentType =
    getResolvedContentType(
      contentType,
      base64Content
    )

  const previewType =
    getPreviewType(
      resolvedContentType,
      fileName
    )

  if (
    !isValidPdfBase64(
      base64Content,
      previewType
    )
  ) {
    throw new Error(
      'Dataverse returned a file reference instead of valid PDF content.'
    )
  }

  const fileUrl =
    previewType === 'pdf'
      ? base64ToBlobUrl(base64Content, resolvedContentType)
      : `data:${resolvedContentType};base64,${base64Content}`

  const dataUrl = `data:${resolvedContentType};base64,${base64Content}`

  console.log(
    'Generated PDF URL:',
    fileUrl.substring(0, 100)
  )

  return {
    url: fileUrl,
    dataUrl,
    contentType: resolvedContentType,
    base64Content,
    previewType,
  }
}
