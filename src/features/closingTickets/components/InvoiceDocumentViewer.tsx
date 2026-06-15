import { DocumentViewerPanel } from '../../newOwnerTickets/components/DocumentViewerPanel'
import type { NewOwnerDocumentDefinition } from '../../newOwnerTickets/utils/dataverseFileUtils'
import type { ClosingTicketRecord } from '../types/closingTicket'

interface InvoiceDocumentViewerProps {
  closingTicket: ClosingTicketRecord
}

const INVOICE_DOCUMENTS: readonly NewOwnerDocumentDefinition[] = [
  {
    key: 'closingTicketDetailsPdf',
    label: 'Invoice',
    columnName: 'cr109_closingticketdetailspdf',
    fileNameColumn: 'cr109_closingticketdetailspdf_name',
  },
]

export function InvoiceDocumentViewer({
  closingTicket,
}: InvoiceDocumentViewerProps) {
  return (
    <DocumentViewerPanel
      closingTicket={closingTicket}
      documents={INVOICE_DOCUMENTS}
      selectedDocument="closingTicketDetailsPdf"
      onSelectDocument={() => {}}
    />
  )
}
