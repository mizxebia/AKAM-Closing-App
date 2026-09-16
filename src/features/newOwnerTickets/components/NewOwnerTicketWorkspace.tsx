import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import type { ScheduledChargeRecord } from '../../charges'
import { NewOwnerTicketTab } from './NewOwnerTicketTab'

interface NewOwnerTicketWorkspaceProps {
  closingTicket: ClosingTicketRecord
  scheduledCharges?: ScheduledChargeRecord[]
  onSaved: () => Promise<void>
  onGenerateTicket?: () => Promise<void>
  readOnly?: boolean
  isCompleted?: boolean
}

export function NewOwnerTicketWorkspace({
  closingTicket,
  scheduledCharges = [],
  onSaved,
  onGenerateTicket,
  readOnly = false,
  isCompleted = false,
}: NewOwnerTicketWorkspaceProps) {
  return (
    <NewOwnerTicketTab
      closingTicket={closingTicket}
      scheduledCharges={scheduledCharges}
      onSaved={onSaved}
      onGenerateTicket={onGenerateTicket}
      readOnly={readOnly}
      isCompleted={isCompleted}
    />
  )
}
