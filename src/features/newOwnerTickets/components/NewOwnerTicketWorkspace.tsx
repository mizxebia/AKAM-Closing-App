import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import { NewOwnerTicketTab } from './NewOwnerTicketTab'

interface NewOwnerTicketWorkspaceProps {
  closingTicket: ClosingTicketRecord
}

export function NewOwnerTicketWorkspace({
  closingTicket,
}: NewOwnerTicketWorkspaceProps) {
  return <NewOwnerTicketTab closingTicket={closingTicket} />
}
