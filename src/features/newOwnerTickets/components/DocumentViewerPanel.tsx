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
import {
  renderDocumentViewer,
  type ViewerState,
} from './documentPreviewRenderer'

interface DocumentViewerPanelProps {
  closingTicket: ClosingTicketRecord
  documents?: readonly NewOwnerDocumentDefinition[]
  selectedDocument: ClosingTicketDocumentKey | null
  onSelectDocument: (
    documentKey: ClosingTicketDocumentKey
  ) => void
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

  // Identifies *this specific file* rather than the whole ticket record.
  // closingTicket is a brand-new object reference every time any part of
  // the page saves (invoice rows, Yardi charges, notes, etc.), and using
  // it directly as an effect dependency was causing the currently-open
  // document to be re-downloaded and re-decoded from scratch on every one
  // of those unrelated saves. The filename only changes when the file
  // itself is actually replaced, so it's a much more precise signal.
  const activeDocumentFileName = activeDocument
    ? (closingTicket[activeDocument.fileNameColumn] ?? null)
    : null

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

    // Deliberately scoped to activeDocumentFileName, not closingTicket — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeDocument,
    activeDocumentFileName,
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
