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
      className="grid grid-cols-2 gap-2"
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
                ? 'min-h-9 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-sm'
                : 'min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300'
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
