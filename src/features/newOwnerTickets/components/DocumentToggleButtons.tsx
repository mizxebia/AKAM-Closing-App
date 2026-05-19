import {
  NEW_OWNER_DOCUMENTS,
  hasDocument,
  type NewOwnerDocumentKey,
} from '../utils/dataverseFileUtils'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'

interface DocumentToggleButtonsProps {
  closingTicket: ClosingTicketRecord
  selectedDocument: NewOwnerDocumentKey | null
  onSelectDocument: (documentKey: NewOwnerDocumentKey) => void
}

export function DocumentToggleButtons({
  closingTicket,
  selectedDocument,
  onSelectDocument,
}: DocumentToggleButtonsProps) {
  return (
    <div
      className="document-toggle-group"
      aria-label="Document preview selector"
    >
      {NEW_OWNER_DOCUMENTS.map((document) => {
        const documentExists = hasDocument(
          closingTicket,
          document
        )
        const isActive =
          selectedDocument === document.key

        return (
          <button
            key={document.key}
            type="button"
            className={
              isActive
                ? 'document-toggle document-toggle-active'
                : 'document-toggle'
            }
            onClick={() =>
              onSelectDocument(document.key)
            }
            disabled={!documentExists}
            aria-pressed={isActive}
          >
            {document.label}
          </button>
        )
      })}
    </div>
  )
}
