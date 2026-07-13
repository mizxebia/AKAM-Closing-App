import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'

import {
  type DataverseFilePreview,
  getDataverseFileUrl,
  getDocumentDefinition,
  getDocumentFileName,
  hasDocument,
  NEW_OWNER_DOCUMENTS,
  type ClosingTicketDocumentKey,
  type NewOwnerDocumentDefinition,
} from '../utils/dataverseFileUtils'

import { DocumentToggleButtons } from './DocumentToggleButtons'

interface DocumentViewerPanelProps {
  closingTicket: ClosingTicketRecord
  documents?: readonly NewOwnerDocumentDefinition[]
  selectedDocument: ClosingTicketDocumentKey | null
  onSelectDocument: (
    documentKey: ClosingTicketDocumentKey
  ) => void
}

type ViewerState =
  | 'empty'
  | 'loading'
  | 'ready'
  | 'error'
  | 'unsupported'

function renderDocumentViewer(
  viewerState: ViewerState,
  filePreview: DataverseFilePreview | null,
  fileName: string,
  errorMessage: string | null
) {

  if (viewerState === 'empty') {
    return (
      <div className="document-viewer-state">
        <strong>No file present</strong>
      </div>
    )
  }

  if (viewerState === 'error') {
    return (
      <div className="document-viewer-state document-viewer-error">
        <strong>
          Unable to preview file.
        </strong>

        <span>
          {errorMessage ??
            'The file could not be fetched from Dataverse.'}
        </span>
      </div>
    )
  }

  if (
    viewerState ===
    'unsupported'
  ) {
    return (
      <div className="document-viewer-state">
        <strong>
          Preview not supported
        </strong>

        <span>
          This file is present,
          but only PDF and image
          previews are available
          here.
        </span>
      </div>
    )
  }

  if (
    viewerState === 'loading'
  ) {
    return (
      <div className="document-loading-overlay">
        <div className="document-loader" />
      </div>
    )
  }

  if (
    filePreview?.previewType ===
    'image'
  ) {
    if (
      !filePreview.url.startsWith(
        'data:image/'
      )
    ) {
      return (
        <div className="document-viewer-state document-viewer-error">
          <strong>
            Unable to preview file.
          </strong>

          <span>
            The image preview URL is invalid.
          </span>
        </div>
      )
    }

    return (
      <div className="document-image-frame">
        <img
          src={filePreview.url}
          alt={fileName}
        />
      </div>
    )
  }

  if (
    filePreview?.previewType ===
    'pdf'
  ) {
    if (
      !filePreview.url.startsWith(
        'blob:'
      ) &&
      !filePreview.url.startsWith(
        'data:application/pdf;base64,JVBER'
      )
    ) {
      return (
        <div className="document-viewer-state document-viewer-error">
          <strong>
            Unable to preview file.
          </strong>

          <span>
            The PDF data returned from Dataverse is not valid.
          </span>
        </div>
      )
    }

    // Append #toolbar=0 to suppress the browser PDF viewer's toolbar.
    // This prevents the embedded PDF /Title metadata (e.g. the original
    // scanner filename like "SKM_C650i26061813460") from being displayed
    // inside the viewer. The correct Dataverse filename is shown in the
    // panel header above instead.
    const pdfSrc = filePreview.url.startsWith('blob:')
      ? `${filePreview.url}#toolbar=0`
      : filePreview.url

    return (
      <iframe
        src={pdfSrc}
        title={fileName}
        className="document-preview-frame"
      />
    )
  }

 return filePreview ? (
  <iframe
    src={filePreview.url}
    title={fileName}
    className="document-preview-frame"
  />
) : (
    <div className="document-viewer-state document-viewer-error">
      <strong>
        Unable to preview file.
      </strong>
    </div>
  )
}

export function DocumentViewerPanel({
  closingTicket,
  documents = NEW_OWNER_DOCUMENTS,
  selectedDocument,
  onSelectDocument,
}: DocumentViewerPanelProps) {

  const [
    viewerState,
    setViewerState,
  ] =
    useState<ViewerState>(
      'empty'
    )

  const [
    filePreview,
    setFilePreview,
  ] =
    useState<DataverseFilePreview | null>(
      null
    )

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    )

  const activeDocument =
    useMemo(
      () =>
        selectedDocument
          ? getDocumentDefinition(
              selectedDocument,
              documents
            )
          : null,
      [documents, selectedDocument]
    )

  const fileName = useMemo(() => {

    if (!activeDocument) {
      return 'No file present'
    }

    return getDocumentFileName(
      closingTicket,
      activeDocument
    )

  }, [
    activeDocument,
    closingTicket,
  ])

  useEffect(() => {

    if (
      !activeDocument ||
      !hasDocument(
        closingTicket,
        activeDocument
      )
    ) {

      setFilePreview(null)

      setErrorMessage(null)

      setViewerState(
        'empty'
      )

      return
    }

    let isActive = true

    // Revoke any previous blob URL to free memory before loading next document
    setFilePreview((prev) => {
      if (prev?.url.startsWith('blob:')) {
        URL.revokeObjectURL(prev.url)
      }
      return null
    })

    setErrorMessage(null)

    setViewerState(
      'loading'
    )

    getDataverseFileUrl(
      closingTicket,
      activeDocument
    )
      .then((preview) => {

        if (!isActive) {
          // Revoke blob URL if we navigated away before it was used
          if (preview.url.startsWith('blob:')) {
            URL.revokeObjectURL(preview.url)
          }
          return
        }

        setFilePreview(
          preview
        )

        setViewerState(
          preview.previewType ===
            'unsupported'
            ? 'unsupported'
            : 'ready'
        )
      })
      .catch((err) => {

        if (!isActive) {
          return
        }

        setFilePreview(null)

        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Unable to preview file.'
        )

        setViewerState(
          'error'
        )
      })

    return () => {

      isActive = false
    }

  }, [
    activeDocument,
    closingTicket,
  ])

  return (
    <aside className="document-panel">
      <div className="document-panel-inner">

        <div className="document-panel-header">

          <div>
            <p>Documents</p>

            <h3>{fileName}</h3>
          </div>

          <DocumentToggleButtons
            closingTicket={closingTicket}
            documents={documents}
            selectedDocument={selectedDocument}
            onSelectDocument={onSelectDocument}
          />

        </div>

        <div
          className="document-preview-shell"
          aria-live="polite"
        >

          {renderDocumentViewer(
            viewerState,
            filePreview,
            fileName,
            errorMessage
          )}

        </div>
      </div>
    </aside>
  )
}
