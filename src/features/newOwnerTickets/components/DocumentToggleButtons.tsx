import {
  NEW_OWNER_DOCUMENTS,
  hasDocument,
  type ClosingTicketDocumentKey,
  type NewOwnerDocumentDefinition,
} from '../utils/dataverseFileUtils'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'

interface DocumentToggleButtonsProps {
  closingTicket: ClosingTicketRecord
  documents?: readonly NewOwnerDocumentDefinition[]
  selectedDocument: ClosingTicketDocumentKey | null
  onSelectDocument: (documentKey: ClosingTicketDocumentKey) => void
}

export function DocumentToggleButtons({
  closingTicket,
  documents = NEW_OWNER_DOCUMENTS,
  selectedDocument,
  onSelectDocument,
}: DocumentToggleButtonsProps) {
  return (
    <div
      className="flex gap-2 w-full"
      aria-label="Document preview selector"
    >
      {documents.map((document) => {
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
                ? 'flex-1 min-w-0 rounded-lg bg-slate-950 px-2 py-2 text-[0.7rem] font-semibold text-white shadow-sm text-center'
                : 'flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[0.7rem] font-semibold text-slate-600 text-center transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300'
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
