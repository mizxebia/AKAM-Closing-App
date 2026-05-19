import { useEffect, useMemo, useState } from 'react'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import {
  type DataverseFilePreview,
  getDataverseFileUrl,
  getDocumentDefinition,
  getDocumentFileName,
  hasDocument,
  type NewOwnerDocumentKey,
} from '../utils/dataverseFileUtils'
import { DocumentToggleButtons } from './DocumentToggleButtons'

interface DocumentViewerPanelProps {
  closingTicket: ClosingTicketRecord
  selectedDocument: NewOwnerDocumentKey | null
  onSelectDocument: (documentKey: NewOwnerDocumentKey) => void
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
        <strong>Unable to preview file.</strong>
        <span>
          {errorMessage ??
            'The file could not be fetched from Dataverse.'}
        </span>
      </div>
    )
  }

  if (viewerState === 'unsupported') {
    return (
      <div className="document-viewer-state">
        <strong>Preview not supported</strong>
        <span>
          This file is present, but only PDF and image previews are
          available here.
        </span>
      </div>
    )
  }

  if (viewerState === 'loading') {
    return (
      <div className="document-loading-overlay">
        <div className="document-loader" />
        <span>Loading document...</span>
      </div>
    )
  }

  if (filePreview?.previewType === 'image') {
    return (
      <div className="document-image-frame">
        <img src={filePreview.url} alt={fileName} />
      </div>
    )
  }

  return filePreview ? (
    <iframe
      title={fileName}
      className="document-preview-frame"
      src={filePreview.url}
    />
  ) : (
    <div className="document-viewer-state document-viewer-error">
      <strong>Unable to preview file.</strong>
    </div>
  )
}

export function DocumentViewerPanel({
  closingTicket,
  selectedDocument,
  onSelectDocument,
}: DocumentViewerPanelProps) {
  const [viewerState, setViewerState] =
    useState<ViewerState>('empty')
  const [filePreview, setFilePreview] =
    useState<DataverseFilePreview | null>(null)
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const activeDocument = useMemo(
    () =>
      selectedDocument
        ? getDocumentDefinition(selectedDocument)
        : null,
    [selectedDocument]
  )

  const fileName = useMemo(() => {
    if (!activeDocument) {
      return 'No file present'
    }

    return getDocumentFileName(closingTicket, activeDocument)
  }, [activeDocument, closingTicket])

  useEffect(() => {
    if (
      !activeDocument ||
      !hasDocument(closingTicket, activeDocument)
    ) {
      setFilePreview(null)
      setErrorMessage(null)
      setViewerState('empty')

      return
    }

    const controller = new AbortController()
    let createdObjectUrl: string | null = null
    let isActive = true
    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, 12000)

    setFilePreview(null)
    setErrorMessage(null)
    setViewerState('loading')

    getDataverseFileUrl(
      closingTicket,
      activeDocument,
      controller.signal
    )
      .then((preview) => {
        createdObjectUrl = preview.url

        if (!isActive) {
          URL.revokeObjectURL(preview.url)
          return
        }

        setFilePreview(preview)
        setViewerState(
          preview.previewType === 'unsupported'
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
          controller.signal.aborted
            ? 'Unable to preview file. The request timed out.'
            : err instanceof Error
              ? err.message
              : 'Unable to preview file.'
        )
        setViewerState('error')
      })
      .finally(() => {
        window.clearTimeout(timeoutId)
      })

    return () => {
      isActive = false
      controller.abort()
      window.clearTimeout(timeoutId)
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl)
      }
    }
  }, [activeDocument, closingTicket])

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
