import type {
  ClosingTicketColumn,
  ClosingTicketRecord,
} from '../types/closingTicket'
import {
  formatClosingTicketValue,
  getClosingTicketStatusDisplay,
} from '../utils/closingTicketFormatters'

interface ClosingTicketTableProps {
  records: ClosingTicketRecord[]
  columns: ClosingTicketColumn[]
  onRecordSelect: (recordId: string) => void
}

export function ClosingTicketTable({
  records,
  columns,
  onRecordSelect,
}: ClosingTicketTableProps) {
  return (
    <div className="table-card">
      <div className="table-card-header">
        <h2>Recent Closings</h2>
        <button type="button">View All</button>
      </div>
      <table className="record-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr
              key={
                record.cr7de_closingticketdetailsid
              }
              className="record-table-row"
              onClick={() =>
                onRecordSelect(
                  record.cr7de_closingticketdetailsid
                )
              }
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' ||
                  event.key === ' '
                ) {
                  event.preventDefault()
                  onRecordSelect(
                    record.cr7de_closingticketdetailsid
                  )
                }
              }}
            >
              {columns.map((column) => (
                <td key={column.key}>
                  {column.key ===
                  'cr7de_ticketstatus' ? (
                    <StatusBadge record={record} />
                  ) : (
                    formatClosingTicketValue(
                      record,
                      column.key
                    )
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({
  record,
}: {
  record: ClosingTicketRecord
}) {
  const status = getClosingTicketStatusDisplay(
    record.cr7de_ticketstatus
  )

  return (
    <span className={`status-pill status-${status.tone}`}>
      {status.label}
    </span>
  )
}
