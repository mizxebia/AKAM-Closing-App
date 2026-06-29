import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../components/ui/alert-dialog'
import {
  Cr7de_invoicedetailsescr109_dueatclosing,
  Cr7de_invoicedetailsescr7de_paidby,
  Cr7de_invoicedetailsescr7de_payableto,
} from '../../../generated/models/Cr7de_invoicedetailsesModel'
import type {
  InvoiceChargeFormRow,
  InvoiceColumn,
  InvoiceRecord,
} from '../types/invoice'
import {
  formatDueAtClosing,
  formatPayableToLabel,
  formatInvoiceDate,
  formatInvoiceValue,
} from '../utils/invoiceFormatters'

interface InvoiceRowProps {
  record: InvoiceRecord
  columns: InvoiceColumn[]
  onSaveEdit: (
    recordId: string,
    row: InvoiceChargeFormRow,
    oldRecord: InvoiceRecord
  ) => Promise<boolean>
  onDelete: (recordId: string, oldRecord: InvoiceRecord) => void
  isUpdating: boolean
  isDeleting: boolean
}

type DueAtClosingValue = Exclude<
  InvoiceChargeFormRow['cr109_dueatclosing'],
  ''
>

const dueAtClosingOptions = Object.keys(
  Cr7de_invoicedetailsescr109_dueatclosing
).map((value) => Number(value))

const paidByOptions = Object.entries(
  Cr7de_invoicedetailsescr7de_paidby
)

const payableToOptions = Object.entries(
  Cr7de_invoicedetailsescr7de_payableto
)

function createEditRowFromRecord(
  record: InvoiceRecord
): InvoiceChargeFormRow {
  return {
    id: record.cr7de_invoicedetailsid,
    cr109_dueatclosing: record.cr109_dueatclosing ?? '',
    cr7de_amount: record.cr7de_amount ?? '',
    cr7de_chequenumber: record.cr7de_chequenumber ?? '',
    cr7de_index: record.cr7de_index ?? '',
    cr7de_notapplicabletoledger:
      record.cr7de_notapplicabletoledger ?? false,
    cr7de_paidby: record.cr7de_paidby ?? '',
    cr7de_payableto: record.cr7de_payableto ?? '',
    cr109_otherpayableto: record.cr109_otherpayableto ?? '',
  }
}

export function InvoiceRow({
  record,
  columns,
  onSaveEdit,
  onDelete,
  isUpdating,
  isDeleting,
}: InvoiceRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editRow, setEditRow] = useState(
    createEditRowFromRecord(record)
  )

  useEffect(() => {
    if (!isEditing) {
      setEditRow(createEditRowFromRecord(record))
    }
  }, [isEditing, record])

  const updateEditRow = (
    changedFields: Partial<InvoiceChargeFormRow>
  ) => {
    setEditRow((currentRow) => ({
      ...currentRow,
      ...changedFields,
    }))
  }

  const cancelEdit = () => {
    setEditRow(createEditRowFromRecord(record))
    setIsEditing(false)
  }

  const saveEdit = async () => {
    const saved = await onSaveEdit(
      record.cr7de_invoicedetailsid,
      editRow,
      record
    )

    if (saved) {
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <tr className="invoice-row-editing">
        <td>
          <select
            className="invoice-edit-control"
            value={editRow.cr109_dueatclosing}
            onChange={(event) =>
              updateEditRow({
                cr109_dueatclosing:
                  event.target.value === ''
                    ? ''
                    : Number(
                        event.target.value
                      ) as InvoiceChargeFormRow['cr109_dueatclosing'],
              })
            }
          >
            <option value="">Select payment</option>
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
            className="invoice-edit-control"
            value={editRow.cr7de_paidby}
            onChange={(event) =>
              updateEditRow({
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
            className="invoice-edit-control"
            type="text"
            inputMode="decimal"
            placeholder="Amount or TBD"
            value={editRow.cr7de_amount}
            onChange={(event) =>
              updateEditRow({
                cr7de_amount: event.target.value,
              })
            }
          />
        </td>
        <td>
          <select
            className="invoice-edit-control"
            value={editRow.cr7de_payableto}
            onChange={(event) =>
              updateEditRow({
                cr7de_payableto:
                  event.target.value === ''
                    ? ''
                    : Number(
                        event.target.value
                      ) as InvoiceChargeFormRow['cr7de_payableto'],
                cr109_otherpayableto:
                  Number(event.target.value) !== 716070002
                    ? ''
                    : editRow.cr109_otherpayableto,
              })
            }
          >
            <option value="">Payable to</option>
            {payableToOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {formatPayableToLabel(label)}
              </option>
            ))}
          </select>
          {Number(editRow.cr7de_payableto) === 716070002 && (
            <input
              className="invoice-edit-control"
              style={{ marginTop: '4px' }}
              value={editRow.cr109_otherpayableto}
              onChange={(event) =>
                updateEditRow({
                  cr109_otherpayableto: event.target.value,
                })
              }
              placeholder="Specify payable to..."
            />
          )}
        </td>
        <td>
          <input
            className="invoice-edit-control"
            value={editRow.cr7de_chequenumber}
            onChange={(event) =>
              updateEditRow({
                cr7de_chequenumber: event.target.value,
              })
            }
          />
        </td>
        <td>
          <label className="invoice-edit-checkbox">
            <input
              type="checkbox"
              checked={editRow.cr7de_notapplicabletoledger}
              onChange={(event) =>
                updateEditRow({
                  cr7de_notapplicabletoledger:
                    event.target.checked,
                })
              }
            />
            N/A
          </label>
        </td>
        <td>{formatInvoiceDate(record.createdon)}</td>
        <td>
          <div className="invoice-row-actions">
            <button
              className="invoice-row-action-button invoice-row-save-button"
              type="button"
              onClick={saveEdit}
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving' : 'Save'}
            </button>
            <button
              className="invoice-row-action-button"
              type="button"
              onClick={cancelEdit}
              disabled={isUpdating}
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      {columns.map((column) => {
        if (column.key === 'cr7de_amount') {
          const raw = record.cr7de_amount
          const num = Number(raw?.replace(/[$,]/g, '') ?? 0)
          const isCredit = !Number.isNaN(num) && num < 0
          return (
            <td key={column.key} className={isCredit ? 'invoice-amount-credit' : undefined}>
              {formatInvoiceValue(record, column.key)}
              {isCredit && (
                <span className="invoice-credit-badge" aria-label="Credit">
                  Credit
                </span>
              )}
            </td>
          )
        }
        return (
          <td key={column.key}>
            {column.key === 'cr7de_payableto' && Number(record.cr7de_payableto) === 716070002 && record.cr109_otherpayableto
              ? record.cr109_otherpayableto
              : formatInvoiceValue(record, column.key)}
          </td>
        )
      })}
      <td>
        <div className="invoice-row-actions">
          <button
            className="invoice-row-action-button"
            type="button"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="invoice-row-action-button invoice-row-delete-button"
                type="button"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete Charge
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the selected charge from
                  this closing ticket.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="invoice-confirm-delete-button"
                  onClick={() =>
                    onDelete(record.cr7de_invoicedetailsid, record)
                  }
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  )
}
