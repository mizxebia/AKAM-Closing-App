import {
  Cr7de_invoicedetailsescr109_dueatclosing,
  Cr7de_invoicedetailsescr7de_paidby,
  Cr7de_invoicedetailsescr7de_payableto,
} from '../../../generated/models/Cr7de_invoicedetailsesModel'
import type { InvoiceChargeFormRow } from '../types/invoice'
import { formatDueAtClosing } from '../utils/invoiceFormatters'

type DueAtClosingValue = Exclude<
  InvoiceChargeFormRow['cr109_dueatclosing'],
  ''
>

interface ChargeEntryRowProps {
  row: InvoiceChargeFormRow
  onChange: (
    rowId: string,
    changedFields: Partial<InvoiceChargeFormRow>
  ) => void
  onRemove: (rowId: string) => void
  canRemove: boolean
}

const dueAtClosingOptions = Object.keys(
  Cr7de_invoicedetailsescr109_dueatclosing
).map((value) => Number(value))

const paidByOptions = Object.entries(
  Cr7de_invoicedetailsescr7de_paidby
)

const payableToOptions = Object.entries(
  Cr7de_invoicedetailsescr7de_payableto
)

export function ChargeEntryRow({
  row,
  onChange,
  onRemove,
  canRemove,
}: ChargeEntryRowProps) {
  return (
    <tr>
      <td>
        <select
          value={row.cr109_dueatclosing}
          onChange={(event) =>
            onChange(row.id, {
              cr109_dueatclosing:
                event.target.value === ''
                  ? ''
                  : Number(
                      event.target.value
                    ) as InvoiceChargeFormRow['cr109_dueatclosing'],
            })
          }
        >
          <option value="">Select charge</option>
          {dueAtClosingOptions.map((value) => (
            <option key={value} value={value}>
              {formatDueAtClosing(
                value as DueAtClosingValue
              )}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          value={row.cr7de_paidby}
          onChange={(event) =>
            onChange(row.id, {
              cr7de_paidby:
                event.target.value === ''
                  ? ''
                  : Number(
                      event.target.value
                    ) as InvoiceChargeFormRow['cr7de_paidby'],
            })
          }
        >
          <option value="">Paid by</option>
          {paidByOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="text"
          value={row.cr7de_amount}
          onChange={(event) =>
            onChange(row.id, {
              cr7de_amount: event.target.value,
            })
          }
          placeholder="0.00 or TBD"
        />
      </td>
      <td>
        <select
          value={row.cr7de_payableto}
          onChange={(event) =>
            onChange(row.id, {
              cr7de_payableto:
                event.target.value === ''
                  ? ''
                  : Number(
                      event.target.value
                    ) as InvoiceChargeFormRow['cr7de_payableto'],
            })
          }
        >
          <option value="">Payable to</option>
          {payableToOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          value={row.cr7de_chequenumber}
          onChange={(event) =>
            onChange(row.id, {
              cr7de_chequenumber: event.target.value,
            })
          }
          placeholder="Cheque #"
        />
      </td>
      <td>
        <input
          value={row.cr7de_remarks}
          onChange={(event) =>
            onChange(row.id, {
              cr7de_remarks: event.target.value,
            })
          }
          placeholder="Description"
        />
      </td>
      <td>
        <label className="charge-checkbox">
          <input
            type="checkbox"
            checked={row.cr7de_notapplicabletoledger}
            onChange={(event) =>
              onChange(row.id, {
                cr7de_notapplicabletoledger:
                  event.target.checked,
              })
            }
          />
          N/A
        </label>
      </td>
      <td>
        <button
          className="charge-remove-button"
          type="button"
          disabled={!canRemove}
          onClick={() => onRemove(row.id)}
        >
          Remove
        </button>
      </td>
    </tr>
  )
}
