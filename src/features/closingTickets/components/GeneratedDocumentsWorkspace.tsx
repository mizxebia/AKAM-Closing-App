import { useEffect, useMemo, useState } from 'react'
import { DocumentViewerPanel } from '../../newOwnerTickets/components/DocumentViewerPanel'
import {
  GENERATED_CLOSING_DOCUMENTS,
  getDefaultDocument,
  type ClosingTicketDocumentKey,
} from '../../newOwnerTickets/utils/dataverseFileUtils'
import type { ClosingTicketRecord } from '../types/closingTicket'

interface GeneratedDocumentsWorkspaceProps {
  closingTicket: ClosingTicketRecord
}

export function GeneratedDocumentsWorkspace({
  closingTicket,
}: GeneratedDocumentsWorkspaceProps) {
  const defaultDocument = useMemo(
    () =>
      getDefaultDocument(
        closingTicket,
        GENERATED_CLOSING_DOCUMENTS
      ),
    [closingTicket]
  )
  const [selectedDocument, setSelectedDocument] =
    useState<ClosingTicketDocumentKey | null>(
      defaultDocument
    )

  useEffect(() => {
    setSelectedDocument(defaultDocument)
  }, [defaultDocument])

  return (
    <DocumentViewerPanel
      closingTicket={closingTicket}
      documents={GENERATED_CLOSING_DOCUMENTS}
      selectedDocument={selectedDocument}
      onSelectDocument={setSelectedDocument}
    />
  )
}
