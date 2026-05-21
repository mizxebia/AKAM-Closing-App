import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import { NewOwnerTicketTab } from './NewOwnerTicketTab'

interface NewOwnerTicketWorkspaceProps {
  closingTicket: ClosingTicketRecord
  onSaved: () => Promise<void>
}

export function NewOwnerTicketWorkspace({
  closingTicket,
  onSaved,
}: NewOwnerTicketWorkspaceProps) {
  return (
    <NewOwnerTicketTab
      closingTicket={closingTicket}
      onSaved={onSaved}
    />
  )
}
