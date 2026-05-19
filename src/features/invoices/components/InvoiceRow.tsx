import type {
  InvoiceColumn,
  InvoiceRecord,
} from '../types/invoice'
import { formatInvoiceValue } from '../utils/invoiceFormatters'

interface InvoiceRowProps {
  record: InvoiceRecord
  columns: InvoiceColumn[]
}

export function InvoiceRow({
  record,
  columns,
}: InvoiceRowProps) {
  return (
    <tr>
      {columns.map((column) => (
        <td key={column.key}>
          {formatInvoiceValue(record, column.key)}
        </td>
      ))}
    </tr>
  )
}

