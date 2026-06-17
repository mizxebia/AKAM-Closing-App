import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import { NewOwnerTicketTab } from './NewOwnerTicketTab'

interface NewOwnerTicketWorkspaceProps {
  closingTicket: ClosingTicketRecord
  onSaved: () => Promise<void>
  onGenerateTicket?: () => Promise<void>
  generatingTicket?: boolean
  readOnly?: boolean
}

export function NewOwnerTicketWorkspace({
  closingTicket,
  onSaved,
  onGenerateTicket,
  generatingTicket,
  readOnly = false,
}: NewOwnerTicketWorkspaceProps) {
  return (
    <NewOwnerTicketTab
      closingTicket={closingTicket}
      onSaved={onSaved}
      onGenerateTicket={onGenerateTicket}
      generatingTicket={generatingTicket}
      readOnly={readOnly}
    />
  )
}
