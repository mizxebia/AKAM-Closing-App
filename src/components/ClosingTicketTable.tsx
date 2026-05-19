import type {
  Cr7de_closingticketdetailses,
} from '../generated/models/Cr7de_closingticketdetailsesModel'

import {
  Cr7de_closingticketdetailsescr7de_ticketstatus,
} from '../generated/models/Cr7de_closingticketdetailsesModel'

export type ColumnKey =
  | 'cr7de_ticketid'
  | 'cr7de_buyername'
  | 'cr7de_sellername'
  | 'cr7de_buildingname'
  | 'cr7de_unitnumber'
  | 'cr7de_closingdate'
  | 'cr7de_ticketstatus'

export type Column = {
  key: ColumnKey
  label: string
}

interface ClosingTicketTableProps {
  records: Cr7de_closingticketdetailses[]
  columns: Column[]
}

function formatValue(
  record: Cr7de_closingticketdetailses,
  key: ColumnKey
) {
  const rawValue =
    record[
      key as keyof Cr7de_closingticketdetailses
    ]

  if (
    rawValue === undefined ||
    rawValue === null ||
    rawValue === ''
  ) {
    return '-'
  }

  // Format status option set
  if (key === 'cr7de_ticketstatus') {
    return (
      Cr7de_closingticketdetailsescr7de_ticketstatus[
        rawValue as keyof typeof Cr7de_closingticketdetailsescr7de_ticketstatus
      ] || String(rawValue)
    )
  }

  // Format date
  if (key === 'cr7de_closingdate') {
    const parsedDate = new Date(
      String(rawValue)
    )

    return Number.isNaN(
      parsedDate.getTime()
    )
      ? String(rawValue)
      : parsedDate.toLocaleDateString()
  }

  return String(rawValue)
}

export function ClosingTicketTable({
  records,
  columns,
}: ClosingTicketTableProps) {
  return (
    <div className="table-card">
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
            >
              {columns.map((column) => (
                <td key={column.key}>
                  {formatValue(
                    record,
                    column.key
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