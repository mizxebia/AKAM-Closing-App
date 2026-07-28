import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import type { ScheduledChargeRecord } from '../../charges'
import { NewOwnerTicketTab } from './NewOwnerTicketTab'

interface NewOwnerTicketWorkspaceProps {
  closingTicket: ClosingTicketRecord
  scheduledCharges?: ScheduledChargeRecord[]
  onSaved: () => Promise<void>
  onGenerateTicket?: () => Promise<void>
  generatingTicket?: boolean
  readOnly?: boolean
  isCompleted?: boolean
}

export function NewOwnerTicketWorkspace({
  closingTicket,
  scheduledCharges = [],
  onSaved,
  onGenerateTicket,
  generatingTicket,
  readOnly = false,
  isCompleted = false,
}: NewOwnerTicketWorkspaceProps) {
  return (
    <NewOwnerTicketTab
      closingTicket={closingTicket}
      scheduledCharges={scheduledCharges}
      onSaved={onSaved}
      onGenerateTicket={onGenerateTicket}
      generatingTicket={generatingTicket}
      readOnly={readOnly}
      isCompleted={isCompleted}
    />
  )
}
